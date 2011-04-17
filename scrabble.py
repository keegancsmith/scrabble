from counter import Counter

import random

class Bag(object):
    letter_distribution = {
        '_': (2, 0),
        'E': (12, 1), 'A': (9, 1), 'I': (9, 1), 'O': (8, 1), 'N': (6, 1),
        'R': (6, 1), 'T': (6, 1), 'L': (4, 1), 'S': (4, 1), 'U': (4, 1),
        'D': (4, 2), 'G': (4, 2),
        'B': (2, 3), 'C': (2, 3), 'M': (2, 3), 'P': (2, 3),
        'F': (2, 4), 'H': (2, 4), 'V': (2, 4), 'W': (2, 4), 'Y': (2, 4),
        'K': (1, 5),
        'J': (1, 8), 'X': (1, 8),
        'Q': (1, 10), 'Z': (1, 10)
    }

    def __init__(self):
        self.bag = list(''.join(c * freq for c, (freq, points)
                                in Bag.letter_distribution.iteritems()))
        random.shuffle(self.bag)

    def can_swap(self, tiles=None):
        if tiles is not None and len(tiles) > 7:
            return False
        return len(self.bag) >= 7

    def swap(self, tiles):
        assert self.can_swap(tiles)
        i = len(self.bag) - len(tiles)
        new_tiles = self.bag[i:]
        self.bag = self.bag[:i] + tiles
        random.shuffle(self.bag)
        return new_tiles

    def tiles_left(self):
        return len(self.bag)

    def pop_tiles(self, n):
        n = min(len(self.bag), n)
        i = len(self.bag) - n
        tiles = self.bag[i:]
        self.bag = self.bag[:i]
        return tiles

    @classmethod
    def points(cls, tile):
        if tile.islower():
            return 0
        return cls.letter_distribution[tile][1]


def get_multipliers():
    if hasattr(get_multipliers, 'multipliers'):
        return get_multipliers.multipliers

    board_layout = """
3w    2l      3w      2l    3w
  2w      3l      3l      2w
    2w      2l  2l      2w
2l    2w      2l      2w    2l
        2w          2w
  3l      3l      3l      3l
    2l      2l  2l      2l
3w    2l      2w      2l    3w
    2l      2l  2l      2l
  3l      3l      3l      3l
        2w          2w
2l    2w      2l      2w    2l
    2w      2l  2l      2w
  2w      3l      3l      2w
3w    2l      3w      2l    3w
"""

    word = {}
    letter = {}
    rows = board_layout.split('\n')[1:-1]
    for r, row in enumerate(rows):
        for c in range(15):
            if c * 2 + 1 >= len(row) or row[c * 2 + 1] == ' ':
                continue
            elif row[c * 2 + 1] == 'w':
                word[(r, c)] = int(row[c * 2])
            else:
                assert row[c * 2 + 1] == 'l', row[c * 2 + 1]
                letter[(r, c)] = int(row[c * 2])

    get_multipliers.multipliers = {'word': word, 'letter':letter}
    return get_multipliers.multipliers


def get_dictionary(dict_name):
    # TODO make this setup.py aware
    if hasattr(get_dictionary, dict_name):
        return get_dictionary.dict_name

    import os.path
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        'data', '%s.txt' % dict_name)

    with file(path, 'r') as fp:
        d = set(line.strip() for line in fp)

    setattr(get_dictionary, dict_name, d)
    return d

class IllegalMove(Exception):
    def __init__(self, message):
        self.message = message
    def __str__(self):
        return 'IllegalMove: ' + self.message

class ScrabbleGame(object):
    def __init__(self, num_players, dict_name='sowpods'):
        assert 2 <= num_players <= 4
        self.num_players = num_players
        self.bag = Bag()
        self.racks = [Counter(self.bag.pop_tiles(7)) for i in range(num_players)]
        self.scores = [0 for i in range(num_players)]
        self.player = 0
        self.board = {}
        self.dictionary = dict_name
        self.winner = []
        self.scoreless_turns = 0

        multipliers = get_multipliers()
        self.word_mul = multipliers['word']
        self.letter_mul = multipliers['letter']

    def play_tiles(self, played_tiles):
        if not played_tiles:
            self.scoreless_turn()
            return {'words': {}, 'score': 0}

        # Work out new rack. Still needs to take tiles out of bag once we know
        # the move played is valued.
        old_rack = self.racks[self.player]
        new_rack = old_rack - Counter(v if v.isupper() else '_'
                                      for v in played_tiles.values())
        old_rack_len = sum(old_rack.values())
        new_rack_len = sum(new_rack.values())
        if old_rack_len - len(played_tiles) != new_rack_len:
            raise IllegalMove('Played tiles not in rack.')

        # Check if each tile is in a valid position
        for v in played_tiles.keys():
            if v in self.board:
                raise IllegalMove(
                    'Position (%d, %d) already has a tile on it.' % v)
            if not (0 <= v[0] < 15 and 0 <= v[1] < 15):
                raise IllegalMove(
                    'Tile at position (%d, %d) is not on the board.' % v)

        # Check if the starting move goes through the middle
        if not any(self.scores) and (7, 7) not in played_tiles:
            raise IllegalMove('First word played must go through '
                              'the middle tile.')

        # Check all the tiles are in a single row or a single column
        if len(played_tiles) > 1:
            x, y = list(played_tiles.keys())[:2]
            for r, c in played_tiles:
                horiz = r == x[0] == y[0]
                vert  = c == x[1] == y[1]
                if not (vert or horiz):
                    raise IllegalMove(
                        'Tiles need to align horizontally or vertically')

        # Check if the tiles are connected
        if len(played_tiles) > 1:
            p = played_tiles.keys()
            p.sort()
            for i in range(len(p) - 1):
                x, y = p[i], p[i + 1]
                for j in range(1, y[0] - x[0] + y[1] - x[1]):
                    if x[0] == y[0]:
                        has_tile = (x[0], x[1] + j) in self.board
                    else:
                        has_tile = (x[0] + j, x[1]) in self.board
                    if not has_tile:
                        raise IllegalMove('All tiles need to be adjacent or '
                                          'have already played tiles '
                                          'inbetween them.')

        # Get list of played words
        words = {}
        def get_word(r, c, dr, dc):
            # Find start of word
            while (r, c) in self.board or (r, c) in played_tiles:
                r -= dr
                c -= dc
            r += dr
            c += dc

            # Calculate score
            sr, sc = r, c
            word_mul = 1
            word = []
            score = 0
            while (r, c) in self.board or (r, c) in played_tiles:
                pos = (r, c)
                if pos in self.board:
                    c = self.board[pos]
                    word.append(c)
                    score += Bag.score(c)
                else:
                    c = played_tiles[pos]
                    word.append(c)
                    v = Bag.score(c)
                    if pos in self.word_mul:
                        word_mul *= self.word_mul[pos]
                    elif pos in self.letter_mul:
                        v *= self.letter_mul[pos]
                    score += v
                r += dr
                c += dc
            score *= word_mul

            if len(word) <= 1:
                return (None, None, None)

            return (''.join(word), (sr, sc), score)
        # XXX a lot slower than necessary
        for r, c in played_tiles:
            word, start_pos, score = get_word(r, c, 1, 0)
            if word is not None:
                words[(word, start_pos)] = score
            word, start_pos, score = get_word(r, c, 0, 1)
            if word is not None:
                words[(word, start_pos)] = score

        for word, _ in words:
            if word.upper() not in get_dictionary(self.dictionary):
                raise IllegalMove('"%s" is not a word.' % word)

        if not words:
            raise IllegalMove('Must play a valid word.')

        # From here on out we know the move played is valid
        score = sum(words.values())

        # Update the rack
        tiles_needed = 7 - new_rack_len
        new_rack.update(self.bag.pop_tiles(tiles_needed))
        self.racks[self.player] = new_rack

        # Check if player used all tiles, and as such receives a bonus 50pts
        if tiles_needed == 7:
            score += 50

        # Check for endgame
        if not new_rack:
            for i in range(self.num_players):
                rack_value = sum(Bag.score(c) for c in self.rack.elements())
                self.scores[i] -= rack_value
                score += rack_value

        self.scores[self.player] += score
        self.scoreless_turns = 0

        # End game now that the scores are updated
        if not new_rack:
            self.end_game()

        self.player = (self.player + 1) % self.num_players

        return {'words': words, 'score': score}

    def scoreless_turn(self):
        self.player = (self.player + 1) % self.num_players
        assert 0 <= self.scoreless_turns < 6
        if any(self.scores):
            self.scoreless_turns += 1
            if self.scoreless_turns == 6:
                self.end_game()

    def skip(self):
        self.scoreless_turn()

    def swap(self, tiles):
        if not self.bag.can_swap(tiles):
            raise IllegalMove('Cannot swap tiles.')

        old_rack = self.racks[self.player]
        new_rack = old_rack - Counter(tiles)
        old_rack_len = sum(old_rack.values())
        new_rack_len = sum(new_rack.values())
        if old_rack_len - len(tiles) != new_rack_len:
            raise IllegalMove('Swapping tiles not in rack.')

        new_rack.update(self.bag.swap(tiles))
        self.racks[self.player] = new_rack

    def end_game(self):
        winning_score = max(self.scores)
        self.winners = [i for i, score in enumerate(self.scores)
                        if score == winning_score]
