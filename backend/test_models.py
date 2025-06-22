#!/usr/bin/env python3
"""
Test script to verify SQLAlchemy models work with the database
"""

from database.database import engine
from models.models import User, Student, Hall, Room
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

def test_models():
    """Test that SQLAlchemy models can query the database successfully"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("🔍 Testing SQLAlchemy models with database...")
        
        # Test User model
        print("\n1. Testing User model...")
        users = session.query(User).limit(3).all()
        print(f"✅ Found {len(users)} users:")
        for user in users:
            print(f"   - ID: {user.id}, Name: {user.name}, Email: {user.email}, Role: {user.role}")
        
        # Test query with relationships
        print("\n2. Testing relationships...")
        user_with_student = session.query(User).filter(User.role == 'student').first()
        if user_with_student and user_with_student.student:
            print(f"✅ User-Student relationship works: {user_with_student.name} -> Student ID: {user_with_student.student.student_ID}")
        else:
            print("⚠️  No student relationship found (this is OK if no students have been assigned)")
        
        # Test raw table access
        print("\n3. Testing table existence...")
        tables_query = text("SHOW TABLES")
        tables = session.execute(tables_query).fetchall()
        table_names = [table[0] for table in tables]
        
        required_tables = ["User", "Student", "Hall", "Room", "Category", "Status"]
        for table in required_tables:
            if table in table_names:
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' missing")
        
        session.close()
        print("\n🎉 SQLAlchemy models test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ SQLAlchemy models test failed: {e}")
        session.close()
        return False

if __name__ == "__main__":
    test_models()
