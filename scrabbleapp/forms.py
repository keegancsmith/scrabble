from scrabbleapp.models import Game

from django import forms
from django.contrib.auth.models import User


class CreateGameForm(forms.Form):
    name = forms.CharField(max_length=50, required=False)
    player1 = forms.ChoiceField(choices=[], label='Player 1', required=False)
    player2 = forms.ModelChoiceField(queryset=User.objects.none(), label='Player 2', required=True)
    player3 = forms.ModelChoiceField(queryset=User.objects.none(), label='Player 3', required=False)
    player4 = forms.ModelChoiceField(queryset=User.objects.none(), label='Player 4', required=False)

    def __init__(self, user, *args, **kw):
        super(CreateGameForm, self).__init__(*args, **kw)
        self.user = user
        self.fields['player1'].choices.append((user.username, user.username))

        # XXX we need a friends model
        friends_qs = User.objects.all()
        for i in range(2, 5):
            field = self.fields['player%d' % i]
            field.queryset = friends_qs
            field.choices = []

    def create_game(self):
        players = [self.user]
        for i in range(2, 5):
            field = 'player%d' % i
            if self.cleaned_data[field]:
                players.append(self.cleaned_data[field])

        name = self.cleaned_data['name'].strip()
        if not name:
            name = u"%s's game" % self.user.username

        return Game.create_game(players, name)
