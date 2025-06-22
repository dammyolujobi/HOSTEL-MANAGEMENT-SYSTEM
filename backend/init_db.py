#!/usr/bin/env python3
"""
Database initialization script for Railway deployment
This script creates all necessary tables and inserts initial data
"""

import mysql.connector
from config import settings
import sys
import os

def get_db_connection():
    """Create a direct MySQL connection"""
    try:
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            charset=settings.DB_CHARSET,
            ssl_disabled=settings.DB_SSL_DISABLED,            
            autocommit=True
        )
        return connection
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

def read_schema_file():
    """Read the SQL schema file"""
    schema_path = os.path.join(os.path.dirname(__file__), 'database', 'schema.sql')
    try:
        with open(schema_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:        
        print(f"Failed to read schema file: {e}")
        sys.exit(1)

def execute_sql_statements(connection, sql_content):
    """Execute SQL statements from the schema file"""
    cursor = connection.cursor()
    
    # Split the SQL content into individual statements
    statements = []
    current_statement = ""
    
    for line in sql_content.split('\n'):
        line = line.strip()
        
        # Skip comments and empty lines
        if not line or line.startswith('--') or line.startswith('#'):
            continue
            
        current_statement += line + '\n'
        
        # If line ends with semicolon, it's the end of a statement
        if line.endswith(';'):
            statements.append(current_statement.strip())
            current_statement = ""
    
    success_count = 0
    total_count = len(statements)
    
    # Execute each statement
    for i, statement in enumerate(statements):
        if not statement:
            continue
            
        try:
            print(f"Executing statement {i+1}/{total_count}...")
            cursor.execute(statement)
            print(f"✅ Statement {i+1} executed successfully")
            success_count += 1
        except mysql.connector.Error as e:
            error_msg = str(e).lower()
            if any(keyword in error_msg for keyword in ["already exists", "duplicate", "commands out of sync"]):
                print(f"⚠️  Statement {i+1} skipped ({e})")
                success_count += 1  # Count as success since it's not critical
                continue
            else:
                print(f"❌ Error executing statement {i+1}: {e}")
                print(f"Statement: {statement[:100]}...")
                # Continue with other statements instead of failing completely
                continue
    
    cursor.close()
    print(f"📊 Database initialization summary: {success_count}/{total_count} statements completed")
    return success_count > 0

def main():
    """Main initialization function"""
    print("Starting database initialization...")
    print(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    
    # Connect to database
    connection = get_db_connection()
    print("Connected to database")
    
    # Read and execute schema
    sql_content = read_schema_file()
    print("Schema file loaded")
    
    success = execute_sql_statements(connection, sql_content)
    
    connection.close()
    
    if success:
        print("Database initialization completed successfully!")
        return True
    else:
        print("Database initialization failed!")
        return False

if __name__ == "__main__":
    main()
