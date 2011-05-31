from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    'example_project.lazynewgame.views',
    url(r'^new/$', 'new_lobby', name='lobby-new'),
    url(r'^([^/]+)/$', 'lobby', name='lobby'),
    url(r'^([^/]+)/create/$', 'create_game', name='lobby-creategame'),
    url(r'^([^/]+)/create-lazy-user/$', 'create_lazy_user', name='lobby-createlazyuser'),
)
