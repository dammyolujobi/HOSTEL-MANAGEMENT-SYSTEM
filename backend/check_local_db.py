#!/usr/bin/env python3

import mysql.connector
from config import settings

def check_and_create_local_database():
    """Check if local database exists and create it if needed"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            charset=settings.DB_CHARSET
        )
        
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute(f"SHOW DATABASES LIKE '{settings.DB_NAME}'")
        result = cursor.fetchone()
        
        if not result:
            print(f"📦 Database '{settings.DB_NAME}' does not exist. Creating...")
            cursor.execute(f"CREATE DATABASE {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{settings.DB_NAME}' created successfully!")
        else:
            print(f"✅ Database '{settings.DB_NAME}' already exists")
        
        cursor.close()
        connection.close()
        
        # Test connection to the specific database
        test_connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            charset=settings.DB_CHARSET
        )
        test_connection.close()
        print(f"✅ Successfully connected to database '{settings.DB_NAME}'")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ MySQL Error: {e}")
        print(f"📋 Connection details:")
        print(f"   Host: {settings.DB_HOST}")
        print(f"   Port: {settings.DB_PORT}")
        print(f"   User: {settings.DB_USER}")
        print(f"   Database: {settings.DB_NAME}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking local database connection...")
    print("=" * 50)
    check_and_create_local_database()
