import sys
globals().update(vars(sys.modules['example_project.settings']))

DEBUG = False
TEMPLATE_DEBUG = True

# Add django-sentry
INSTALLED_APPS += (
    'sentry',
    'sentry.client',
)

# Change the secret key from the one used in settings.py since that is public
SECRET_KEY = 'oe8m_^si9yv^%t2t0#*=t4$1p2j&)4jdm3!ygl=&jp)d_v+g58'
