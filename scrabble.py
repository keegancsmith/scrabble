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
                                in Bag.letter_distribution))
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


class Board(object):
    word_multiplier = None
    letter_multiplier = None

    def __init__(self):
        if Board.word_multiplier is None:
            Board.calculate_multipliers()
        self.board = [[None] * 15 for i in range(15)]

    @classmethod
    def calculate_multipliers(cls):
        cls.word_multiplier = {}
        cls.letter_multiplier = {}

        for r in (0, 7, 14):
            for c in (0, 7, 14):
                cls.word_multiplier[(r, c)] = 3
        cls.word_multiplier[(7, 7)] = 2
        for i in range(1, 5):
            cls.word_multiplier[(i, i)] = 2
            cls.word_multiplier[(i, 14 - i)] = 2
            cls.word_multiplier[(14 - i, i)] = 2
            cls.word_multiplier[(14 - i, 14 - i)] = 2

        for dr, dc in ((5, 1), (1, 5), (5, 5)):
            cls.letter_multiplier[(dr, dc)] = 3
            cls.letter_multiplier[(14 - dr, dc)] = 3
            cls.letter_multiplier[(dr, 14 - dc)] = 3
            cls.letter_multiplier[(14 - dr, 14 - dc)] = 3

        for dr, dc in ((3, 0), (6, 2), (0, 3), (7, 3), (2, 6), (6, 6), (3, 7)):
            cls.letter_multiplier[(dr, dc)] = 2
            cls.letter_multiplier[(14 - dr, dc)] = 2
            cls.letter_multiplier[(dr, 14 - dc)] = 2
            cls.letter_multiplier[(14 - dr, 14 - dc)] = 2


class ScrabbleGame(object):
    def __init__(self, num_players):
        assert 2 <= num_players <= 4
        self.bag = Bag()
        self.racks = [self.bag.pop_tiles(7) for i in range(num_players)]


Board.calculate_multipliers()
