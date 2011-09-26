from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    'scrabbleapp.views',
    (r'^$', 'active_games'),
    url(r'^create-game/$', 'create_game', name='game-create'),
    url(r'^active-games/$', 'active_games', name='list-active-games'),
    url(r'^active-games/json/$', 'active_games_json', name='active-games-json'),
    url(r'^game/(\d+)/$', 'get_game', name='game'),
    url(r'^game/(\d+)/state/$', 'game_state', name='game-state'),
    url(r'^game/(\d+)/immutable-state/$', 'game_immutable_state', name='game-immutable-state'),
    url(r'^game/(\d+)/play/$', 'game_play', name='game-play'),
    url(r'^game/(\d+)/chat/$', 'game_chat', name='game-chat'),
    url(r'^game/(\d+)/notification/$', 'notification', name='game-notification'),
    url(r'^game/(\d+)/dictionary/$', 'word_in_dictionary', name='word-in-dictionary'),
)
