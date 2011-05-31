from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    url('', include('scrabbleapp.urls')),
    url(r'^accounts/login/$', 'django.contrib.auth.views.login'),
    url(r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}),
    url(r'^lobby/', include('lazynewgame.urls')),
    url(r'^convert/', include('lazysignup.urls')),
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()

if 'sentry' in settings.INSTALLED_APPS:
    urlpatterns += patterns('', (r'^sentry/', include('sentry.web.urls')))
