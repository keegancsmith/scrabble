from django.db import models

try:
    import cPickle as pickle
except ImportError:
    import pickle


class PickleField(models.TextField):
    """Based on JSONField from django-annoying, but using pickle instead."""

    __metaclass__ = models.SubfieldBase

    def to_python(self, value):
        if value == '':
            return None
        try:
            if isinstance(value, basestring):
                return pickle.loads(str(value))
        except ValueError:
            return value

    def get_db_prep_save(self, value, *args, **kwargs):
        value = pickle.dumps(value)
        return super(PickleField, self).get_db_prep_save(value, *args, **kwargs)
