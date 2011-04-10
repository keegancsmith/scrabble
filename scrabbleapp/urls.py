from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'scrabbleapp.views',
    (r'^$', 'active_games'),
    (r'^/create_game/$', 'create_game'),
    (r'^/active_games/$', 'active_games'),
    (r'^/(\d+)/game_state/$', 'game_state'),
    (r'^/(\d+)//$', 'game_play_tiles'),
    (r'^/(\d+)//$', 'game_pass'),
    (r'^/(\d+)//$', 'game_swap_tiles'),
)
