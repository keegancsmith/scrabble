from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'scrabbleapp.views',
    (r'^$', 'active_games'),
    (r'^create_game/$', 'create_game'),
    (r'^active_games/$', 'active_games'),

    url(r'^(\d+)/$', 'get_game', name='game'),
    url(r'^(\d+)/game_state/$', 'game_state', name='game-state'),
    url(r'^(\d+)/game_move/$', 'game_move', name='game-move'),
)
