from scrabble import IllegalMove, get_dictionary
from scrabbleapp.models import Game
from scrabbleapp.forms import CreateGameForm

import json

from annoying.decorators import ajax_request, render_to
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import (HttpResponseForbidden, HttpResponseBadRequest,
                         HttpResponseRedirect)
from django.shortcuts import get_object_or_404
from django.utils.html import escape
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST, require_GET
from uni_form.helpers import FormHelper, Submit, Reset

def game_required(func):
    def f(request, game_id, *args, **kw):
        game = get_object_or_404(Game, pk=game_id)
        if request.user not in game.players.all():
            return HttpResponseForbidden()
        request.game = game
        return func(request, *args, **kw)
    return login_required(f)

def pos_key_to_js_key(dic):
    return dict(('%d,%d' % k, v) for k, v in dic.iteritems())

def js_key_to_pos_key(dic):
    return dict((tuple(map(int, k.split(','))), v) for k, v in dic.iteritems())

@login_required
@render_to('scrabbleapp/create_game.html')
def create_game(request):
    if request.method == 'POST':
        form = CreateGameForm(request.user, request.POST)
        if form.is_valid():
            game = form.create_game()
            return HttpResponseRedirect(game.get_absolute_url())
    else:
        form = CreateGameForm(request.user)

    # add in a submit button
    helper = FormHelper()
    submit = Submit('create','create a new game')
    helper.add_input(submit)

    # XXX need friends model
    friends = User.objects.exclude(pk=request.user.pk)
    friends_json = json.dumps(dict((u.pk, escape(u.username))
                              for u in friends))

    return {
        'form': form,
        'helper': helper,
        'friends': friends_json,
        'username': request.user.username
    }

@login_required
@render_to('scrabbleapp/active_games.html')
def active_games(request):
    gs = request.user.game_set
    return {
        'my_turn': gs.filter(winner=None).filter(current_player=request.user),
        'other':   gs.filter(winner=None).exclude(current_player=request.user),
        'recent':  gs.exclude(winner=None).order_by('-last_played')[:10],
    }

@game_required
@require_GET
@render_to('scrabbleapp/game.html')
def get_game(request):
    return { 'game': request.game }

@never_cache
@game_required
@require_GET
@ajax_request
def notification(request):
    cursor = int(request.GET.get('cursor', '-1'))
    notifications = []
    if 'history' not in request.GET and cursor == request.game.cursor():
        request.game.wait()

    if cursor < 0:
        cursor = 0

    return { 'notifications': request.game.notification_history(cursor),
             'cursor': request.game.cursor() }

@never_cache
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
        'winners': g.winners,
        'board': pos_key_to_js_key(g.board),
        'turn': request.game.turn,
        'tiles_left': g.bag.tiles_left(),
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
def game_chat(request):
    msg = request.POST['msg'].strip()
    if msg:
        request.game.chat(request.user, msg)
    return { 'success': bool(msg) }

@game_required
@require_POST
@ajax_request
def game_play(request):
    if request.user != request.game.current_player:
        return HttpResponseForbidden()

    move = request.POST['move']
    if move not in ('play_tiles', 'skip', 'swap'):
        return HttpResponseBadRequest()

    try:
        if move == 'play_tiles':
            played_tiles = js_key_to_pos_key(json.loads(request.POST['played_tiles']))
            ret = request.game.do_move(move, played_tiles)
            ret['words'] = dict(('%d,%d' % k[1], {'word': k[0], 'score': v})
                                for k, v in ret['words'].iteritems())
            return ret
        elif move == 'skip':
            request.game.do_move(move)
            return {}
        else:
            assert move == 'swap'
            tiles = json.loads(request.POST['tiles'])
            request.game.do_move(move, tiles)
            return {}

    except IllegalMove as e:
        return {'illegal_move': e.message}


@game_required
@require_POST
@ajax_request
def word_in_dictionary(request):
    word = request.POST['word']
    dictionary = get_dictionary(request.game.game_instance.dictionary)
    return {
        'word': word,
        'in_dictionary': word.upper() in dictionary,
    }
