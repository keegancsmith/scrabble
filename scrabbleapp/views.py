from scrabble import IllegalMove
from scrabbleapp.models import Game

import json

from annoying.decorators import ajax_request, render_to
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST, require_GET

def game_required(func):
    def f(request, game_id, *args, **kw):
        game = get_object_or_404(Game, pk=game_id)
        if request.user not in game.players.all():
            raise HttpResponseForbidden()
        request.game = game
        return func(request, *args, **kw)
    return login_required(f)

@login_required
def create_game(request):
    return HttpResponse('<html><body>create_game</body></html>')

@login_required
def active_games(request):
    games = request.user.game_set.all()
    return HttpResponse('<html><body>active_games<ul>%s</ul></body></html>' %
                        '\n'.join('<li><a href="%s">%s</a></li>' % (g.get_absolute_url(), unicode(g))
                                  for g in games))

@game_required
@require_GET
@render_to('scrabbleapp/game.html')
def get_game(request):
    return { 'game': request.game }

@game_required
@require_GET
@ajax_request
def game_state(request):
    g = request.game.game_instance
    player_num = request.game.gameplayer_set.get(user=request.user).player_num
    return {
        'num_players': g.num_players,
        'rack': list(g.racks[player_num].elements()),
        'scores': g.scores,
        'current_player': g.player,
        'winners': g.winner,
        'board': g.board
    }

@game_required
@require_GET
@ajax_request
def game_immutable_state(request):
    player_num = request.game.gameplayer_set.get(user=request.user).player_num
    return {
        'players': [{
                'username': u.username,
                'first_name': u.first_name,
                'last_name': u.last_name
            } for u in request.game.get_players()],
        'player_num': player_num
    }

@game_required
@require_POST
@ajax_request
def game_play(request):
    if request.user != request.game.current_player:
        raise HttpResponseForbidden()

    move = request.POST['move']
    if move not in ('play_tiles', 'skip', 'swap'):
        raise HttpResponseBadRequest()

    try:
        if move == 'play_tiles':
            played_tiles = json.decodes(request.POST['played_tiles'])
            return request.game.do_move(move, played_tiles)
        elif move == 'skip':
            request.game.do_move(move)
            return {}
        else:
            assert move == 'swap'
            tiles = json.decodes(request.POST['tiles'])
            request.game.do_move(move, tiles)
            return {}

    except IllegalMove as e:
        raise HttpResponseBadRequest(e.message)
