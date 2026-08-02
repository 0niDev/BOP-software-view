import os
import sys
import json
import requests
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# ============================================================
# SQLITE CLOUD REST API (Works on PythonAnywhere)
# ============================================================
API_KEY = "bmJZ0l1RTFCoxS0Au17c0iofzZmrDn2Db94v0YtV9Uw"
DATABASE = "cool-depot.sqlite"
PROJECT_ID = "cjja8z6pvz"

# Use the REST API endpoint (port 443 - HTTPS)
API_URL = f"https://{PROJECT_ID}.g4.sqlite.cloud/v2/weblite/sql"

def rest_query(sql: str) -> list:
    """Execute SQL via REST API - works on PythonAnywhere"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    body = {
        "sql": sql,
        "database": DATABASE
    }
    
    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=body,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data:
                return data["data"]
            elif "rows" in data:
                columns = data.get("columns", [])
                rows = data.get("rows", [])
                if columns and rows:
                    return [dict(zip(columns, row)) for row in rows]
                return rows
            return []
        else:
            logger.error(f"API Error: {response.status_code} - {response.text[:200]}")
            return []
    except Exception as e:
        logger.error(f"API Exception: {e}")
        return []

def query(sql: str, params: tuple = ()) -> list:
    """Execute SQL with parameter substitution"""
    # Simple parameter substitution for SQLite
    for p in params:
        if isinstance(p, str):
            sql = sql.replace('?', f"'{p}'", 1)
        else:
            sql = sql.replace('?', str(p), 1)
    return rest_query(sql)

def query_one(sql: str, params: tuple = ()) -> dict:
    results = query(sql, params)
    return results[0] if results else None

# ============================================================
# SERVE HTML
# ============================================================
@app.route("/")
def root():
    return send_from_directory('static', 'index.html')

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory('static', path)

# ============================================================
# TEST ENDPOINT
# ============================================================
@app.route("/api/test")
def test_connection():
    """Test the SQLite Cloud REST API connection"""
    try:
        result = rest_query("SELECT 1 as test, datetime('now') as now, 'SQLite Cloud REST API' as source LIMIT 1")
        if result:
            return jsonify({
                "success": True,
                "message": "✅ Connected to SQLite Cloud via REST API!",
                "result": result,
                "api_url": API_URL
            })
        else:
            return jsonify({
                "success": False,
                "message": "❌ No data returned from API",
                "api_url": API_URL
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "api_url": API_URL
        }), 500

# ============================================================
# DASHBOARD API
# ============================================================
@app.route("/api/dashboard")
def get_dashboard():
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Test connection first
        test = rest_query("SELECT 1 LIMIT 1")
        if not test:
            return jsonify({
                "success": False,
                "error": "Database connection failed. Please check /api/test"
            }), 503
        
        # Today's sales
        sales_today = query("""
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
            FROM sales_invoices 
            WHERE date(invoice_date) = date(?) AND status != 'CANCELLED'
        """, (today,))
        
        # Today's purchases
        purchases_today = query("""
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
            FROM purchase_invoices 
            WHERE date(invoice_date) = date(?) AND status != 'CANCELLED'
        """, (today,))
        
        # Cash balance
        cash = query("""
            SELECT COALESCE(SUM(debit - credit), 0) as balance
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            JOIN accounts a ON a.id = jel.account_id
            WHERE a.account_code = '1000' AND je.is_posted = 1
        """)
        
        # Bank balance
        bank = query("""
            SELECT COALESCE(SUM(debit - credit), 0) as balance
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            JOIN accounts a ON a.id = jel.account_id
            WHERE a.account_code = '1010' AND je.is_posted = 1
        """)
        
        # Revenue
        revenue = query("""
            SELECT COALESCE(SUM(credit), 0) as total
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            JOIN accounts a ON a.id = jel.account_id
            WHERE a.account_type = 'REVENUE' AND je.is_posted = 1
        """)
        
        # Inventory value
        inventory = query("""
            SELECT COALESCE(SUM(quantity_in_stock * purchase_price), 0) as value
            FROM stock_batches WHERE is_active = 1
        """)
        
        # Total items
        items = query("SELECT COUNT(*) as count FROM items WHERE is_active = 1")
        
        # Total parties
        parties = query("SELECT COUNT(*) as count FROM parties WHERE is_active = 1")
        
        # Recent sales
        recent_sales = query("""
            SELECT invoice_number as reference, invoice_date as date, 
                   'Sales' as type, total_amount as amount
            FROM sales_invoices WHERE status != 'CANCELLED' 
            ORDER BY invoice_date DESC LIMIT 5
        """)
        
        # Recent purchases
        recent_purchases = query("""
            SELECT invoice_number as reference, invoice_date as date, 
                   'Purchase' as type, total_amount as amount
            FROM purchase_invoices WHERE status != 'CANCELLED' 
            ORDER BY invoice_date DESC LIMIT 5
        """)
        
        # Combine and sort
        all_recent = recent_sales + recent_purchases
        all_recent.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            "success": True,
            "data": {
                "today": {
                    "sales_total": sales_today[0]["total"] if sales_today else 0,
                    "sales_count": sales_today[0]["count"] if sales_today else 0,
                    "purchases_total": purchases_today[0]["total"] if purchases_today else 0,
                    "purchases_count": purchases_today[0]["count"] if purchases_today else 0,
                },
                "balances": {
                    "cash": cash[0]["balance"] if cash else 0,
                    "bank": bank[0]["balance"] if bank else 0,
                    "inventory": inventory[0]["value"] if inventory else 0,
                },
                "revenue": revenue[0]["total"] if revenue else 0,
                "total_items": items[0]["count"] if items else 0,
                "total_parties": parties[0]["count"] if parties else 0,
                "recent_transactions": all_recent[:10],
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# DATA ENDPOINTS
# ============================================================
@app.route("/api/parties")
def get_parties():
    try:
        parties = query("SELECT * FROM parties WHERE is_active = 1 ORDER BY name")
        return jsonify({"success": True, "data": parties})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/items")
def get_items():
    try:
        items = query("""
            SELECT i.*, 
                   COALESCE(SUM(sb.quantity_in_stock), 0) as current_stock,
                   COALESCE(SUM(sb.quantity_in_stock * sb.purchase_price), 0) as stock_value
            FROM items i
            LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.is_active = 1
            WHERE i.is_active = 1
            GROUP BY i.id
            ORDER BY i.item_code
        """)
        return jsonify({"success": True, "data": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/invoices/sales")
def get_sales_invoices():
    try:
        invoices = query("""
            SELECT si.*, p.name as customer_name
            FROM sales_invoices si
            JOIN parties p ON p.id = si.customer_id
            WHERE si.status != 'CANCELLED'
            ORDER BY si.invoice_date DESC LIMIT 50
        """)
        return jsonify({"success": True, "data": invoices})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/invoices/purchases")
def get_purchase_invoices():
    try:
        invoices = query("""
            SELECT pi.*, p.name as supplier_name
            FROM purchase_invoices pi
            JOIN parties p ON p.id = pi.supplier_id
            WHERE pi.status != 'CANCELLED'
            ORDER BY pi.invoice_date DESC LIMIT 50
        """)
        return jsonify({"success": True, "data": invoices})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/accounts")
def get_accounts():
    try:
        accounts = query("""
            SELECT a.*, 
                   COALESCE(SUM(jel.debit - jel.credit), 0) as current_balance
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1
            WHERE a.is_active = 1
            GROUP BY a.id
            ORDER BY a.account_code
        """)
        return jsonify({"success": True, "data": accounts})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/stock")
def get_stock():
    try:
        stock = query("""
            SELECT i.item_code, i.item_name, i.unit, i.minimum_stock,
                   COALESCE(SUM(sb.quantity_in_stock), 0) as total_stock,
                   COALESCE(SUM(sb.quantity_in_stock * sb.purchase_price), 0) as total_value,
                   COUNT(DISTINCT sb.batch_number) as batch_count
            FROM items i
            LEFT JOIN stock_batches sb ON sb.item_id = i.id AND sb.is_active = 1
            WHERE i.is_active = 1
            GROUP BY i.id
            ORDER BY total_stock DESC
        """)
        return jsonify({"success": True, "data": stock})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# TRIAL BALANCE
# ============================================================
@app.route("/api/reports/trial-balance")
def get_trial_balance():
    try:
        rows = query("""
            SELECT 
                a.account_code as code,
                a.account_name as name,
                a.account_type,
                COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' THEN jel.debit ELSE 0 END), 0) as odr,
                COALESCE(SUM(CASE WHEN je.voucher_type = 'OPENING' THEN jel.credit ELSE 0 END), 0) as ocr,
                COALESCE(SUM(jel.debit), 0) as total_debit,
                COALESCE(SUM(jel.credit), 0) as total_credit
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1
            WHERE a.is_active = 1
            GROUP BY a.id
            HAVING total_debit != 0 OR total_credit != 0
            ORDER BY a.account_code
        """)
        
        result_rows = []
        total_cdr = 0
        total_ccr = 0
        
        for row in rows:
            acc_type = row['account_type']
            odr = row['odr'] or 0
            ocr = row['ocr'] or 0
            total_debit = row['total_debit'] or 0
            total_credit = row['total_credit'] or 0
            
            if acc_type in ['ASSET', 'EXPENSE']:
                net = odr + total_debit - total_credit
                if net >= 0:
                    cdr = net
                    ccr = 0
                else:
                    cdr = 0
                    ccr = abs(net)
            else:
                net = ocr + total_credit - total_debit
                if net >= 0:
                    cdr = 0
                    ccr = net
                else:
                    cdr = abs(net)
                    ccr = 0
            
            total_cdr += cdr
            total_ccr += ccr
            
            result_rows.append({
                "code": row['code'],
                "name": row['name'],
                "account_type": acc_type,
                "odr": round(odr, 2),
                "ocr": round(ocr, 2),
                "cdr": round(cdr, 2),
                "ccr": round(ccr, 2)
            })
        
        grouped = {}
        for row in result_rows:
            t = row['account_type']
            if t not in grouped:
                grouped[t] = []
            grouped[t].append(row)
        
        is_balanced = abs(total_cdr - total_ccr) < 0.01
        
        return jsonify({
            "success": True,
            "data": {
                "title": "Trial Balance",
                "period_label": "As at " + datetime.now().strftime("%B %d, %Y"),
                "generated_at": datetime.now().isoformat(),
                "rows": result_rows,
                "grouped_rows": grouped,
                "parties_summary": [],
                "total_odr": 0,
                "total_ocr": 0,
                "total_cdr": round(total_cdr, 2),
                "total_ccr": round(total_ccr, 2),
                "is_balanced": is_balanced,
                "balance_diff": round(abs(total_cdr - total_ccr), 2)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# PROFIT & LOSS
# ============================================================
@app.route("/api/reports/profit-loss")
def get_profit_loss():
    try:
        date_from = request.args.get('from', datetime.now().replace(day=1).strftime("%Y-%m-%d"))
        date_to = request.args.get('to', datetime.now().strftime("%Y-%m-%d"))
        
        revenue = query("""
            SELECT a.account_code, a.account_name,
                   COALESCE(SUM(jel.credit - jel.debit), 0) as amount
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE a.account_type = 'REVENUE' AND a.is_active = 1 
            AND je.is_posted = 1 AND je.entry_date >= ? AND je.entry_date <= ?
            GROUP BY a.id
            HAVING amount != 0
            ORDER BY a.account_code
        """, (date_from, date_to))
        
        expenses = query("""
            SELECT a.account_code, a.account_name,
                   COALESCE(SUM(jel.debit - jel.credit), 0) as amount
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE a.account_type = 'EXPENSE' AND a.is_active = 1 
            AND je.is_posted = 1 AND je.entry_date >= ? AND je.entry_date <= ?
            GROUP BY a.id
            HAVING amount != 0
            ORDER BY a.account_code
        """, (date_from, date_to))
        
        sales = []
        other_income = []
        total_sales = 0
        
        for r in revenue:
            if r['account_code'].startswith('40'):
                sales.append(r)
                total_sales += r['amount']
            else:
                other_income.append(r)
        
        cost_of_sales = []
        general_admin = []
        total_cogs = 0
        total_general_admin = 0
        
        for e in expenses:
            if e['account_code'].startswith('5'):
                cost_of_sales.append(e)
                total_cogs += e['amount']
            else:
                general_admin.append(e)
                total_general_admin += e['amount']
        
        gross_profit = total_sales - total_cogs
        net_profit = gross_profit - total_general_admin
        
        return jsonify({
            "success": True,
            "data": {
                "title": "Profit & Loss Statement",
                "date_from": date_from,
                "date_to": date_to,
                "generated_at": datetime.now().isoformat(),
                "period_label": f"Period: {date_from} to {date_to}",
                "sales": sales,
                "total_sales": round(total_sales, 2),
                "cost_of_sales": cost_of_sales,
                "total_cost_of_sales": round(total_cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "general_admin": general_admin,
                "total_general_admin": round(total_general_admin, 2),
                "total_operating_expenses": round(total_general_admin, 2),
                "other_income": other_income,
                "total_other_income": 0,
                "profit_from_operations": round(gross_profit - total_general_admin, 2),
                "finance_cost": [],
                "total_finance_cost": 0,
                "profit_before_tax": round(gross_profit - total_general_admin, 2),
                "net_profit": round(net_profit, 2),
                "is_profit": net_profit >= 0,
                "total_revenue": round(total_sales, 2),
                "total_expenses": round(total_cogs + total_general_admin, 2)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# BALANCE SHEET
# ============================================================
@app.route("/api/reports/balance-sheet")
def get_balance_sheet():
    try:
        accounts = query("""
            SELECT a.account_code, a.account_name, a.account_type,
                   COALESCE(SUM(jel.debit - jel.credit), 0) as balance
            FROM accounts a
            LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
            LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_posted = 1
            WHERE a.is_active = 1
            GROUP BY a.id
            ORDER BY a.account_code
        """)
        
        assets = []
        liabilities = []
        equity = []
        
        for acc in accounts:
            item = {
                "code": acc['account_code'],
                "name": acc['account_name'],
                "balance": round(acc['balance'], 2)
            }
            if acc['account_type'] == 'ASSET':
                assets.append(item)
            elif acc['account_type'] == 'LIABILITY':
                liabilities.append(item)
            elif acc['account_type'] == 'EQUITY':
                equity.append(item)
        
        current_assets = [a for a in assets if int(a['code']) < 2000]
        non_current_assets = [a for a in assets if int(a['code']) >= 2000]
        current_liabilities = [l for l in liabilities if int(l['code']) < 3000]
        non_current_liabilities = [l for l in liabilities if int(l['code']) >= 3000]
        
        total_assets = sum(a['balance'] for a in assets)
        total_liabilities = sum(l['balance'] for l in liabilities)
        total_equity = sum(e['balance'] for e in equity)
        
        return jsonify({
            "success": True,
            "data": {
                "title": "Balance Sheet",
                "as_at": datetime.now().strftime("%B %d, %Y"),
                "non_current_assets": non_current_assets,
                "total_non_current_assets": round(sum(a['balance'] for a in non_current_assets), 2),
                "current_assets": current_assets,
                "total_current_assets": round(sum(a['balance'] for a in current_assets), 2),
                "total_assets": round(total_assets, 2),
                "equity": equity,
                "total_equity": round(total_equity, 2),
                "retained_earnings": 0,
                "issued_capital": 0,
                "non_current_liabilities": non_current_liabilities,
                "total_non_current_liabilities": round(sum(l['balance'] for l in non_current_liabilities), 2),
                "current_liabilities": current_liabilities,
                "total_current_liabilities": round(sum(l['balance'] for l in current_liabilities), 2),
                "total_liabilities": round(total_liabilities, 2),
                "total_liabilities_and_equity": round(total_liabilities + total_equity, 2),
                "is_balanced": abs(total_assets - (total_liabilities + total_equity)) < 0.01
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# CASH BOOK
# ============================================================
@app.route("/api/reports/cash-book")
def get_cash_book():
    try:
        date_from = request.args.get('from', datetime.now().replace(day=1).strftime("%Y-%m-%d"))
        date_to = request.args.get('to', datetime.now().strftime("%Y-%m-%d"))
        
        transactions = query("""
            SELECT 
                je.entry_date,
                je.voucher_number,
                jel.debit,
                jel.credit,
                jel.description,
                a.account_code
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            JOIN accounts a ON a.id = jel.account_id
            WHERE je.is_posted = 1
            AND a.account_code IN ('1000', '1010')
            AND je.entry_date >= ? AND je.entry_date <= ?
            ORDER BY je.entry_date, je.id
        """, (date_from, date_to))
        
        cash_in = 0.0
        cash_out = 0.0
        result_transactions = []
        
        for txn in transactions:
            if txn['debit'] and txn['debit'] > 0:
                cash_in += txn['debit']
                result_transactions.append({
                    "date": txn['entry_date'],
                    "voucher": txn['voucher_number'],
                    "description": txn['description'] or 'Cash In',
                    "account": txn['account_code'],
                    "received": round(txn['debit'], 2),
                    "paid": 0,
                    "balance": round(cash_in - cash_out, 2)
                })
            elif txn['credit'] and txn['credit'] > 0:
                cash_out += txn['credit']
                result_transactions.append({
                    "date": txn['entry_date'],
                    "voucher": txn['voucher_number'],
                    "description": txn['description'] or 'Cash Out',
                    "account": txn['account_code'],
                    "received": 0,
                    "paid": round(txn['credit'], 2),
                    "balance": round(cash_in - cash_out, 2)
                })
        
        return jsonify({
            "success": True,
            "data": {
                "title": "Cash Book",
                "date_from": date_from,
                "date_to": date_to,
                "transactions": result_transactions,
                "total_received": round(cash_in, 2),
                "total_paid": round(cash_out, 2),
                "closing_balance": round(cash_in - cash_out, 2)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# PARTY LEDGER
# ============================================================
@app.route("/api/reports/party-ledger/<int:party_id>")
def get_party_ledger(party_id):
    try:
        party = query_one("SELECT id, code, name, party_type FROM parties WHERE id = ?", (party_id,))
        if not party:
            return jsonify({"success": False, "error": "Party not found"}), 404
        
        is_customer = party['party_type'] in ['CUSTOMER', 'BOTH']
        
        transactions = query("""
            SELECT 
                je.entry_date,
                je.voucher_number,
                je.voucher_type,
                jel.debit,
                jel.credit,
                jel.description,
                a.account_code,
                a.account_name
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            JOIN accounts a ON a.id = jel.account_id
            WHERE jel.party_id = ? AND je.is_posted = 1
            ORDER BY je.entry_date, je.id
        """, (party_id,))
        
        opening = query_one("""
            SELECT COALESCE(SUM(debit - credit), 0) as balance
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE jel.party_id = ? AND je.voucher_type = 'OPENING' AND je.is_posted = 1
        """, (party_id,))
        
        opening_balance = opening['balance'] if opening else 0.0
        balance = opening_balance
        result_transactions = []
        total_debit = 0.0
        total_credit = 0.0
        
        for txn in transactions:
            debit = txn['debit'] or 0.0
            credit = txn['credit'] or 0.0
            
            if is_customer:
                balance += debit - credit
            else:
                balance += credit - debit
            
            total_debit += debit
            total_credit += credit
            
            result_transactions.append({
                "date": txn['entry_date'],
                "date_formatted": txn['entry_date'],
                "voucher_number": txn['voucher_number'],
                "voucher_type": txn['voucher_type'],
                "debit": round(debit, 2),
                "credit": round(credit, 2),
                "description": txn['description'] or txn['voucher_type'],
                "account_code": txn['account_code'],
                "account_name": txn['account_name'],
                "balance": round(balance, 2)
            })
        
        balance_type = "Receivable" if balance > 0.01 else ("Payable" if balance < -0.01 else "Zero")
        balance_label = f"{balance_type} Balance"
        
        return jsonify({
            "success": True,
            "data": {
                "title": f"Party Ledger - {party['name']} ({party['code']})",
                "party": party,
                "party_type": party['party_type'],
                "is_customer": is_customer,
                "is_supplier": not is_customer,
                "transactions": result_transactions,
                "opening_balance": round(opening_balance, 2),
                "closing_balance": round(balance, 2),
                "balance_type": balance_type,
                "balance_label": balance_label,
                "total_debit": round(total_debit, 2),
                "total_credit": round(total_credit, 2)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================================
# APPLICATION ENTRY POINT
# ============================================================
application = app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)