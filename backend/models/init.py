from app import db

# Import all models
from .student import Student
from .operator import Operator
from .asset import Asset
from .exit_log import ExitLog

__all__ = ['db', 'Student', 'Operator', 'Asset', 'ExitLog']