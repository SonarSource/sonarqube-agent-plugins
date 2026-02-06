import math
def foo(a):
    return math.isclose(a, 0)

# TODO only i would fix this

class PythonDemo:
    def method_stub(self):
        print('some message')

    @staticmethod
    def static_method(cls):
        # this will be implemented later
        pass
        
    def isclose_relative(a, b, rel_tol=1e-09):
	    diff = abs(a - b)
	    rel_tol * max(abs(a), abs(b))
