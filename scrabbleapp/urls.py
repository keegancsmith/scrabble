from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    'scrabbleapp.views',
    (r'^$', 'active_games'),
    (r'^create_game/$', 'create_game'),
    (r'^active_games/$', 'active_games'),

    url(r'^game/(\d+)/$', 'get_game', name='game'),
    url(r'^game/(\d+)/state/$', 'game_state', name='game-state'),
    url(r'^game/(\d+)/immutable_state/$', 'game_immutable_state', name='game-immutable-state'),
    url(r'^game/(\d+)/play/$', 'game_play', name='game-play'),
)
