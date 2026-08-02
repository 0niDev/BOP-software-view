import sys
import os

# Add project directory to Python path
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

from api_server import app

# For PythonAnywhere WSGI
application = app

if __name__ == "__main__":
    app.run()
