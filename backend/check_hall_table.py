#!/usr/bin/env python3
"""
Check Hall table structure
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine
from sqlalchemy import inspect

def check_hall_table():
    """Check Hall table columns"""
    print("🔍 Checking Hall table structure...")
    
    try:
        inspector = inspect(engine)
        
        # Check Hall table columns
        if 'Hall' in inspector.get_table_names():
            print("📋 Columns in Hall table:")
            columns = inspector.get_columns('Hall')
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
        else:
            print("❌ Hall table not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_hall_table()
