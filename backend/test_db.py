#!/usr/bin/env python3
"""
Test database connection and table existence
"""

import mysql.connector
from config import settings

def test_database():
    """Test database connection and list tables"""
    try:
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            charset=settings.DB_CHARSET,
            ssl_disabled=settings.DB_SSL_DISABLED
        )
        
        cursor = connection.cursor()
        
        print("✅ Connected to database successfully")
        
        # List all tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
          # Check if User table exists and has data
        if ('User',) in tables:
            cursor.execute("SELECT COUNT(*) FROM User")
            user_count = cursor.fetchone()[0]
            print(f"\n👥 User table has {user_count} records")
            
            # Show first few users
            if user_count > 0:
                cursor.execute("SELECT id, name, email, role FROM User LIMIT 5")
                users = cursor.fetchall()
                print("\n👤 Sample users:")
                for user in users:
                    print(f"  - ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Role: {user[3]}")
        else:
            print("\n❌ User table does not exist!")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    test_database()
