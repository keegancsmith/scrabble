from scrabbleapp.models import Game

from annoying.decorators import ajax_request
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, get_object_or_404


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
def get_game(request):
    return HttpResponse('<html><body>%s</body></html>' % unicode(request.game))

@game_required
@ajax_request
def game_state(request):
    g = request.game.game_instance
    player_num = request.game.gameplayer_set.get(user=request.user).player_num
    return {
        'player_num': player_num,
        'num_players': g.num_players,
        'rack': list(g.racks[player_num].elements()),
        'scores': g.scores,
        'current_player': g.player,
        'winners': g.winner,
        'board': g.board
    }

@game_required
def game_move(request):
    return HttpResponse('<html><body>game_move</body></html>')
