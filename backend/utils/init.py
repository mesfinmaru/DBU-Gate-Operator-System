# Utility functions for the backend

def format_response(status, message, data=None):
    """Standardize API responses"""
    response = {
        "status": status,
        "message": message
    }
    if data:
        response["data"] = data
    return response

def validate_student_id(student_id):
    """Validate student ID format"""
    if not student_id or len(student_id) < 3:
        return False
    return True