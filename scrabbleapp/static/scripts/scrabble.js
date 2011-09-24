var canvas;
var ctx;
var urls;

// Game Logic State -- Fetched from Server
var immutable_state = null;
var state = null;
var error_sleep_time = 500;

// UI State
var board_image;
var ui_state = {
    redraw: true,
    selected_tile: null,
    selected_tile_pos: null,
    selected_tile_prev_pos: null,
    new_tiles: {},
    rack_tiles_on_board: {},
    rack_tiles_on_board_idx: {},
    score: 0,
    typing_position: null,
    typing_direction: null
};
var ui_immutable_state = {
    cell_size: 500 / 15,
    board_offset: [50, 10],
    rack_offset: [50 + (500 / 15) * 4, 530]
};

// Only used in draw_board
var multipliers = {
    'word': {"0,7": 3, "14,0": 3, "0,0": 3, "1,1": 2, "13,1": 2, "1,13": 2, "4,10": 2, "3,3": 2, "12,2": 2, "2,2": 2, "4,4": 2, "7,0": 3, "11,3": 2, "2,12": 2, "7,7": 2, "10,4": 2, "13,13": 2, "7,14": 3, "10,10": 2, "14,14": 3, "12,12": 2, "14,7": 3, "11,11": 2, "3,11": 2, "0,14": 3},
    'letter': {"7,3": 2, "0,3": 2, "1,9": 3, "1,5": 3, "6,8": 2, "2,8": 2, "13,9": 3, "2,6": 2, "12,6": 2, "3,7": 2, "5,9": 3, "9,9": 3, "9,1": 3, "11,0": 2, "5,1": 3, "3,0": 2, "11,7": 2, "5,5": 3, "8,8": 2, "8,6": 2, "3,14": 2, "6,6": 2, "8,2": 2, "8,12": 2, "7,11": 2, "5,13": 3, "9,5": 3, "14,11": 2, "9,13": 3, "6,2": 2, "12,8": 2, "14,3": 2, "6,12": 2, "0,11": 2, "11,14": 2, "13,5": 3}
};
var tile_value = {"A": 1, "C": 3, "B": 3, "E": 1, "D": 2, "G": 2, "F": 4, "I": 1, "H": 4, "K": 5, "J": 8, "M": 3, "L": 1, "O": 1, "N": 1, "Q": 10, "P": 3, "S": 1, "R": 1, "U": 1, "T": 1, "W": 4, "V": 4, "Y": 4, "X": 8, "Z": 10, "_": 0};
var new_turn_snd_b64 = ('data:audio/mpeg;base64,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' +
'03W3/////V8YaNbZVQUmJaPF4AB1jUANM+nmL86e5ujr//MwxBQR+z6Zvmna/AowjBEYw4KfG7c/' +
'x1uIH6Gnc7ojf/7/8QiI3Z9W9VTqxvR/0vKv//9QWfr//////8eM0dYBJP3uvwCFtOF8EeTU//Mw' +
'xA0Soz6VnmnVHPQfrPdlaIPIcI7kLlLzf+ngcQehwydzf+npvv6+aBVud+uv90wsd2vGr0OCxZ1/' +
'//AsN//////7dBDHCsi6ACIc//MwxAMQazqRvgQOGHN78AA5gBZPPpfPdJHiKlU4tUh5T/r5MGaK' +
'S1pT+pq21/16goEZ3HVb6f32z2/km4+Mev//AL9P//////FsrQIS//MwxAIO2zaRvoAPYRuMd/AE' +
'PzIEWbcz9TdF+JabpnqjX0/+rx/Nes9ZPWvb/uCT9Hs//3vx1f5viFv//8AT///////jMSohuMfj' +
'AMdR//MwxAcO0z6QfmgPwBQUxHs/V6TcQo3mZ6o39v+vx9T81//a3+yt/uoZxoWqozyj/38dL///' +
'4C///////fwxGzKqJySkvA44EHWPgBpQ//MwxAwNezqdvmgVZOc9XrfjSIszRrS9X/V5IjrrOG/p' +
'6hCz7f//87/bzH///xh///////xvKxUIhQP4IfuAfH239T9BDoi+P6OWev////MgxBcMWzKRHGgP' +
'ZR8LfKS9E4gCvv+2if///p///xD///////yGCgUG5d96AxhtCMG9ff/zMMQMDhs6kR4DzgAfnrwo' +
'DR8+i+3/TwUO6p0T9v530/5wN9aPtWl16U/+3nN///hb///////k49UiQUf+gEdZEB0odX37eLAj' +
'nTfP+v/zIMQUDEp6kH5oC2Bf/5OPee/6p+9ONAZ+n56e9fp/v6t///gL///5RapiLIPhpnk2BdH/' +
'8yDECQriepD8iA/A9tL79JHjcNr/1//6Z7qb//av9q/71kt///1///4Lv///LooCCLKP//MwxAQL' +
'+nqRnmgFYP0Bh+YgMg9zv36L8XEFPt6v/8rbqdF++n9fBAP1a/qq/b//+///+A///+UVBmCgb5Bj' +
'rIgTNS/636m4siAp9/////MgxBUKmnqQ/mgLZOVv79/oG+7dO////+j///4Bf//+XWoSFKAQf/oM' +
'PqIeAxG/Oet+tf/zIMQRDHJ6kb6ACwTyOG8cS39n///rt/Xv7KLX//6pt0sr3/xmu3//Av///lIl' +
'CMUf/MP/8zDEBgvyepEeaA9gHogJw8+v1+pXTIxzt6v/84/tu/vrb09SHdzn9L01//p/Rv//8Jv/' +
'//SqVTUGA/sED6xqAbaXR9fu3EOJBX+v/77/8yDEFwriepEeaA9kc+1/u6G317//1//+v///CX//' +
'/yi6AhrCbf9iDyeCFJ856/Z+I8sU//MgxBILunqRnmgLBNv9v9PL9v/pLsqUH9q6f2+bX6dO43b/' +
'/8G///8vVLCj/6iDuagzHv/zIMQKChp6kP6IDwR9Nuv/i7Xb+rf///Xp/152n3///1/9n///wZ//' +
'/6FKBDCAf7iDrJz/8yDECAtSepD+aBVkCFpdfr/5WfW23//9f7Vt1s7p0t//t/2/R/pZE97KqBHU' +
'0Z//+moA//MgxAEIwnqRnmgLDC7AD/6gDqH8FaT6vW3U/JpHX//p+v3lanff/r///p///wQFK8AP' +
'///zIMQFCTp6kZ6ADwzAD0AzJ59/W3W3YhV9/t/t+f/9vVn/Pavuzf7m///4TwTwo/9wA6z/8yDE' +
'BwlifpD+gAsEpBt6XX9v8jCFX/p//+Vf/+utlf/0/9v//1/f//AmpVUg4AAP/gA+//MgxAgIYnqV' +
'vmgFEKIoKcmrV9v8Zi1fb/7f/26//rf01fq///A1JSBgAH4+AHcuAjCeff/zIMQNCSJ6kb6YBQz+' +
'3+WN//efs9f9kX///7r/9t3mv//wDpUXEwAB/oAH5XQEuS5X7f7/8yDEDwfAcpGeC84ABxb////5' +
'NGryr0/bd9X/lwEjwAH4wA6iKG0n0Pt/k4sV/27X/f/0//MQxBcHinqRnmgFEO9f/////8IqCSEA' +
'AH//8yDEBQhIbpG/TQAA9AA9RgXAJaj3+39ZuOn///z6d81Xp2fbs/t/9tXMzf0A7+7wAACE//Mg' +
'xAoF0FsLAYcQAVCNweiyCKEE818HwaWVTEFNRTMuOTguNFVVVVVVVVVVVVVVVVVVVf/zEMQZAAAD' +
'/AHAAABVVVVVVVVVVVVVVVVV');


if (typeof console == "undefined") {
    window.console = {
        log: function () {}
    };
}


function make_key(x, y) {
    return x + ',' + y;
}


function make_pos(k) {
    k = k.split(',');
    return [parseInt(k[0]), parseInt(k[1])];
}


function draw_line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


function draw_board() {
    var cell_size = ui_immutable_state.cell_size;
    var colours = { 'word'   : { 3 : '#ff4500', 2 : '#ff7f50' },
                    'letter' : { 3 : '#1e90ff', 2 : '#b0e0e6' } };
    var i;

    for (i = 0; i < 15; i++) {
        for (var j = 0; j < 15; j++) {
            var k = make_key(i, j);

            if (state !== null && k in state.board) {
                var colour = k in ui_state.new_tiles ? '#8b1313' : '#8b4513';
                draw_tile(state.board[k], i * cell_size, j * cell_size,
                          colour);
                continue;
            }

            var colour = '#cd853f';
            if (k in multipliers.word) {
                colour = colours.word[multipliers.word[k]];
            } else if (k in multipliers.letter) {
                colour = colours.letter[multipliers.letter[k]];
            }

            ctx.fillStyle = colour;
            ctx.fillRect(i * cell_size, j * cell_size, cell_size, cell_size);
        }
    }

    ctx.strokeStyle = '#deb887';
    ctx.lineWidth = 2;
    for (i = 0; i <= 15; i++) {
        var offset = i * cell_size;
        draw_line(offset, 0, offset, 15 * cell_size);
        draw_line(0, offset, 15 * cell_size, offset);
    }
}


function draw_tile(c, x, y, tile_colour) {
    if (tile_colour === undefined)
        tile_colour = '#966f33';

    var cell_size = ui_immutable_state.cell_size;

    ctx.fillStyle = tile_colour;
    ctx.fillRect(x, y, cell_size, cell_size);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(c.toUpperCase(), x + cell_size / 2, y + cell_size / 2);

    if (c in tile_value) {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(tile_value[c] + '', x + cell_size * 0.9, y + cell_size);
    }
}


function draw_rack() {
    var cell_size = ui_immutable_state.cell_size;
    var i;

    if (state === null) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading game...', cell_size * 7 / 2, cell_size / 2);
        return;
    }

    for (i = 0; i < state.rack.length; i++) {
        // Ignore tiles being moved or that are placed on the board
        if (i == ui_state.selected_tile ||
            i in ui_state.rack_tiles_on_board_idx)
            continue;

        if (state.rack[i].toLowerCase() == state.rack[i])
            state.rack[i] = '_';

        draw_tile(state.rack[i], i * cell_size, 0);
    }

    ctx.strokeStyle = '#f5deb3';
    ctx.lineWidth = 2;
    draw_line(0, 0, 7 * cell_size, 0);
    draw_line(0, cell_size, 7 * cell_size, cell_size);
    for (i = 0; i <= 7; i++)
        draw_line(i * cell_size, 0, i * cell_size, cell_size);
}


function key_to_pixel_coords(k) {
    var cell_size = ui_immutable_state.cell_size;
    var pos = make_pos(k);
    var x = ui_immutable_state.board_offset[0] + pos[0]*cell_size;
    var y = ui_immutable_state.board_offset[1] + pos[1]*cell_size;
    return [x, y];
}

function draw_other_tiles() {
    // Draw moveable tiles on the board
    for (var k in ui_state.rack_tiles_on_board) {
        var idx = ui_state.rack_tiles_on_board[k];
        var pos = key_to_pixel_coords(k);
        draw_tile(state.rack[idx], pos[0], pos[1]);
    }
}


function draw_typing_cursor() {
    if (ui_state.typing_position === null)
        return;

    var pos = key_to_pixel_coords(ui_state.typing_position);
    var cell_size = ui_immutable_state.cell_size;
    ctx.save();
        ctx.translate(pos[0], pos[1]);
    if (ui_state.typing_direction === 1) {
        ctx.rotate(Math.PI/2);
        ctx.translate(0, -cell_size);
    }
    ctx.scale(cell_size, cell_size);
    ctx.moveTo(0.25, 0.5*(1-1/Math.sqrt(3)));
    ctx.lineTo(0.25, 0.5*(1+1/Math.sqrt(3)));
    ctx.lineTo(0.80, 0.5);
    ctx.closePath();
    ctx.fillStyle = 'lightGreen';
    ctx.fill();
    ctx.restore();
}


function draw() {
    if (!ui_state.redraw)
        return;

    ui_state.redraw = false;

    if (ui_state.selected_tile_prev_pos !== null) {
        ctx.save();
        var c = ui_immutable_state.cell_size;
        var x = ui_state.selected_tile_prev_pos.x - c / 2;
        var y = ui_state.selected_tile_prev_pos.y - c / 2;
        ctx.rect(x - 1, y - 1, x + cell_size + 1, y + cell_size + 1);
        ctx.clip();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (board_image === undefined) {
        ctx.save();
        ctx.translate(ui_immutable_state.board_offset[0],
                      ui_immutable_state.board_offset[1]);
        draw_board();
        ctx.restore();
        board_image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        ctx.putImageData(board_image, 0, 0);
    }

    ctx.save();
    ctx.translate(ui_immutable_state.rack_offset[0],
                  ui_immutable_state.rack_offset[1]);
    draw_rack();
    ctx.restore();

    draw_other_tiles();
    draw_typing_cursor();

    if (ui_state.selected_tile_prev_pos !== null) {
        ui_state.selected_tile_prev_pos = ui_state.selected_tile_pos;
        ctx.restore();
    }

    // Draw tile that is currently moving
    if (ui_state.selected_tile !== null)
        draw_tile(state.rack[ui_state.selected_tile],
                  ui_state.selected_tile_pos.x - ui_immutable_state.cell_size / 2,
                  ui_state.selected_tile_pos.y - ui_immutable_state.cell_size / 2);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Value: ' + ui_state.score, 550, 550);
    ctx.restore();
}


function swap_tiles_on_rack(i, j) {
    if (i == j)
        return;

    // Assumes i is not placed on the board
    if (j in ui_state.rack_tiles_on_board_idx) {
        var k = ui_state.rack_tiles_on_board_idx[j];
        delete ui_state.rack_tiles_on_board_idx[j];

        ui_state.rack_tiles_on_board[k] = i;
        ui_state.rack_tiles_on_board_idx[i] = k;
    }

    if (ui_state.selected_tile == i)
        ui_state.selected_tile = j;

    var tmp = state.rack[i];
    state.rack[i] = state.rack[j];
    state.rack[j] = tmp;

    ui_state.redraw = true;
}


function getCursorPosition(e) {
    var x;
    var y;

    if (e.touches != undefined && e.touches.length == 1)
        e = e.touches[0];

    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    return {
        'x' : x,
        'y' : y
    };
}


function position_in_board(p) {
    var x = p.x - ui_immutable_state.board_offset[0];
    var y = p.y - ui_immutable_state.board_offset[1];
    if (x < 0 || y < 0)
        return null;
    x = Math.floor(x / ui_immutable_state.cell_size);
    y = Math.floor(y / ui_immutable_state.cell_size);
    if (x > 14 || y > 14)
        return null;
    return {
        'x': x,
        'y': y
    };
}


function position_in_rack(p) {
    var x = p.x - ui_immutable_state.rack_offset[0];
    var y = p.y - ui_immutable_state.rack_offset[1];
    if (x < 0 || y < 0)
        return null;
    x = Math.floor(x / ui_immutable_state.cell_size);
    y = Math.floor(y / ui_immutable_state.cell_size);
    if (x >= state.rack.length || y > 1)
        return null;
    return x;
}


function disable_typing_cursor() {
    ui_state.typing_position = null;
    ui_state.typing_direction = null;
    ui_state.redraw = true;
}


function toggle_typing_cursor(k) {
    if (ui_state.typing_position !== k) {
        disable_typing_cursor();
    }

    canvas.focus();
    ui_state.typing_position = k;
    switch (ui_state.typing_direction) {
        case null:
            ui_state.typing_direction = 0;
            break;
        case 0:
           ui_state.typing_direction = 1;
           break;
        case 1:
            disable_typing_cursor();
            break;
    }

    ui_state.redraw = true;
}


function advance_typing_cursor() {
    if (ui_state.typing_position === null)
        return;

    var key = ui_state.typing_position;
    var pos = make_pos(key);
    do {
        pos[ui_state.typing_direction]++;
        if (pos[ui_state.typing_direction] > 14) {
            disable_typing_cursor();
            return;
        }
        key = make_key(pos[0], pos[1]);
    } while (key in state.board || key in ui_state.rack_tiles_on_board);
    ui_state.typing_position = key;
    ui_state.redraw = true;
}

function backspace_typing_cursor() {
    if (ui_state.typing_position === null)
        return;

    var key = ui_state.typing_position;
    var pos = make_pos(key);
    do {
        pos[ui_state.typing_direction]--;
        if (pos[ui_state.typing_direction] < 0) {
            disable_typing_cursor();
            return;
        }
        key = make_key(pos[0], pos[1]);
    } while (key in state.board);
    if (key in ui_state.rack_tiles_on_board) {
        var i = ui_state.rack_tiles_on_board[key];
        delete ui_state.rack_tiles_on_board[key];
        delete ui_state.rack_tiles_on_board_idx[i];
    }
    ui_state.typing_position = key;
    ui_state.redraw = true;
}


function mouse_down(e) {
    if (ui_state.selected_tile !== null || state.winners.length > 0)
        return;

    var p = getCursorPosition(e);
    var i = position_in_rack(p);

    if (i === null) {
        var a = position_in_board(p);
        if (a === null)
            return;
        var k = make_key(a.x, a.y);
        if (!(k in ui_state.rack_tiles_on_board)) {
            if (!(k in state.board)) {
                toggle_typing_cursor(k);
                e.preventDefault();
            }
            return;
        }
        i = ui_state.rack_tiles_on_board[k];
        delete ui_state.rack_tiles_on_board[k];
        delete ui_state.rack_tiles_on_board_idx[i];

        ui_state.score = calculate_score();
    }

    ui_state.selected_tile = i;
    ui_state.selected_tile_pos = p;
    ui_state.redraw = true;

    e.preventDefault();
}


function is_blank(tile) {
    return tile.toLowerCase() == tile;
}


function place_tile(tile, key, blank_letter) {
    if (is_blank(state.rack[tile])) {
        if (!blank_letter) {
            var choice = window.prompt('Which letter do you want to place?');
            if (choice === null) {
                return;
            } else if (! /^[a-zA-Z]$/.test(choice)) {
                alert('Must input a single letter!');
                return;
            } else {
                blank_letter = choice[0].toLowerCase();
            }
        }
        state.rack[tile] = blank_letter;
    }

    ui_state.rack_tiles_on_board[key] = tile;
    ui_state.rack_tiles_on_board_idx[tile] = key;
    ui_state.redraw = true;

    if (key === ui_state.typing_position) {
        advance_typing_cursor();
    }
}


function mouse_up(e) {
    if (ui_state.selected_tile === null)
        return;

    var i = ui_state.selected_tile;
    var p = getCursorPosition(e);
    var v = position_in_board(p);

    // On a touch device when the fingers have been lifted there is no
    // position data associated with that. So use ui_state.selected_tile_pos
    // which would be the last position we drew a tile.
    if (p.x < 0) {
        p = ui_state.selected_tile_pos;
        v = position_in_board(p);
    }

    ui_state.selected_tile = null;
    ui_state.redraw = true;

    if (v === null) {
        var j = position_in_rack(p);
        if (j !== null)
            swap_tiles_on_rack(i, j);
        return;
    }

    var k = make_key(v.x, v.y);
    if (k in ui_state.rack_tiles_on_board || k in state.board)
        return;

    place_tile(i, k);

    ui_state.score = calculate_score();
}


function mouse_move(e) {
    if (ui_state.selected_tile === null)
        return;

    e.preventDefault();

    ui_state.selected_tile_pos = getCursorPosition(e);

    var j = position_in_rack(ui_state.selected_tile_pos);
    if (j !== null)
        swap_tiles_on_rack(ui_state.selected_tile, j);

    ui_state.redraw = true;
}


function tile_for_letter(l) {
    var i;
    l = l.toUpperCase();
    for (i = 0; i < state.rack.length; i++) {
        if (state.rack[i] == l && !(i in ui_state.rack_tiles_on_board_idx))
            return i;
    }
    for (i = 0; i < state.rack.length; i++) {
        if (is_blank(state.rack[i]) && !(i in ui_state.rack_tiles_on_board_idx))
            return i;
    }
    return null;
}


function key_down(e) {
    if (ui_state.typing_position === null)
        return;

    if (e.keyCode >= 65 && e.keyCode <= 90) { // letters
        var letter = String.fromCharCode(e.keyCode);
        var tile = tile_for_letter(letter);
        if (tile !== null)
            place_tile(tile, ui_state.typing_position, letter);
    } else if (e.keyCode == 32) { // space
        advance_typing_cursor();
    } else if (e.keyCode == 8) { // backspace
        backspace_typing_cursor();
    } else {
        return;
    }

    e.preventDefault();
}


function pass() {
    $.post(urls.play,
           { 'move': 'skip' },
           function (resp) {
               notification_listener.reset_error_timer(true);
           });
}


function swap() {
    var tiles = window.prompt('Which letters do you want to swap?\n' +
                               'Choices: ' + state.rack.join(', '));
    if (tiles === null)
        return;
    disable_typing_cursor();
    tiles = tiles.toUpperCase().replace(/\s+/g, '').split('');
    tiles.sort();

    $.post(urls.play,
           { 'move': 'swap',
             'tiles': JSON.stringify(tiles) },
           function (resp) {
               if ('illegal_move' in resp) {
                   alert('Illegal Move: ' + resp.illegal_move);
               } else {
                   notification_listener.reset_error_timer(true);
               }
           });
}


function play() {
    if ($.isEmptyObject(ui_state.rack_tiles_on_board)) {
        alert('Place tiles on board before playing');
        return;
    }

    disable_typing_cursor();
    var played_tiles = {};
    $.each(ui_state.rack_tiles_on_board, function(k, rack_idx) {
        played_tiles[k] = state.rack[rack_idx];
    });
    $.post(urls.play,
           { 'move': 'play_tiles',
             'played_tiles': JSON.stringify(played_tiles) },
           function (resp) {
               if ('illegal_move' in resp) {
                   alert('Illegal Move: ' + resp.illegal_move);
               } else {
                   notification_listener.reset_error_timer(true);
                   alert('You scored ' + resp.score + ' points');
               }
           });
}


function word_in_dictionary() {
    var word = $('#dictionary-word').val();
    $.post(urls.word_in_dictionary,
           { word: word },
           function (resp) {
               if (resp.in_dictionary)
                   $('#dictionary-status').html(resp.word + ' is a word');
               else
                   $('#dictionary-status').html(resp.word + ' is not a word');
           });
    return false;
}


function post_chat() {
    var msg = $('#chatarea-input').val();
    $('#chatarea-input').val('');
    $.post(urls.chat,
           { msg: msg },
           function (resp) {
               notification_listener.reset_error_timer(true);
           });
    return false;
}


function recall_tiles() {
    disable_typing_cursor();
    ui_state.score = 0;
    ui_state.rack_tiles_on_board = {};
    ui_state.rack_tiles_on_board_idx = {};
    ui_state.redraw = true;
}


function shuffle_tiles() {
    for (var i = state.rack.length - 1; i > 0; i--) {
        if (i in ui_state.rack_tiles_on_board_idx)
            continue;

        var j;
        do {
            j = Math.floor(Math.random() * (i + 1));
        } while (j in ui_state.rack_tiles_on_board_idx);

        var tmp = state.rack[i];
        state.rack[i] = state.rack[j];
        state.rack[j] = tmp;
    }
    ui_state.redraw = true;
}


function calculate_score() {
    var pos = [];
    for (var k in ui_state.rack_tiles_on_board)
        pos.push(make_pos(k));

    if (pos.length == 0)
        return 0;
    else if (pos.length > 1) {
        // Check that tiles are aligned
        for (var i in pos) {
            var horiz = (pos[0][0] == pos[1][0]) && (pos[1][0] == pos[i][0]);
            var vert  = (pos[0][1] == pos[1][1]) && (pos[1][1] == pos[i][1]);
            if (!(vert || horiz)) {
                //console.log("Tiles are not aligned", ui_state.rack_tiles_on_board);
                return 0;
            }
        }

        // Check that placed tiles are connected
        pos.sort(function (a, b) {
                     if (a[0] == b[0])
                         return a[1] - b[1];
                     return a[0] - b[0];
                 });
        for (i = 0; i < pos.length - 1; i++) {
            var a = pos[i];
            var b = pos[i+1];
            for (var j = 1; j < b[0] - a[0] + b[1] - a[1]; j++) {
                if (a[0] == b[0])
                    k = make_key(a[0], a[1] + j);
                else
                    k = make_key(a[0] + j, a[1]);
                if (!(k in state.board)) {
                    //console.log("Tiles are not connected", ui_state.rack_tiles_on_board, k, pos);
                    return 0;
                }
            }
        }
    }

    var touches_existing_tile = false;
    function get_word(r, c, dr, dc) {
        // Find start of word
        var k = make_key(r, c);
        while ((k in state.board) || (k in ui_state.rack_tiles_on_board)) {
            r -= dr;
            c -= dc;
            k = make_key(r, c);
        }
        r += dr;
        c += dc;

        // Calculate score
        var sr = r;
        var sc = c;
        var word = '';
        var word_mul = 1;
        var score = 0;
        k = make_key(r, c);
        while ((k in state.board) || (k in ui_state.rack_tiles_on_board)) {
            var letter;
            var letter_mul = 1;
            if (k in state.board) {
                touches_existing_tile = true;
                letter = state.board[k];
            } else {
                letter = state.rack[ui_state.rack_tiles_on_board[k]];
                if (k in multipliers.word) {
                    word_mul *= multipliers.word[k];
                } else if (k in multipliers.letter) {
                    letter_mul = multipliers.letter[k];
                }
            }

            if (letter.toUpperCase() == letter)
                score += letter_mul * tile_value[letter];
            word += letter;

            r += dr;
            c += dc;
            k = make_key(r, c);
        }
        score *= word_mul;

        if (word.length <= 1)
            return null;

        var direction = dr == 1 ? 'down' : 'across';
        return [word, [sr, sc], direction, score];
    }

    var words = {};
    for (i in pos) {
        var x = get_word(pos[i][0], pos[i][1], 1, 0);
        if (x !== null)
            words[x[0] + make_key(x[1][0], x[1][1]) + x[2]] = x[3];
        x = get_word(pos[i][0], pos[i][1], 0, 1);
        if (x !== null)
            words[x[0] + make_key(x[1][0], x[1][1]) + x[2]] = x[3];
    }

    var score = 0;
    for (i in words) {
        score += words[i];
    }
    if (pos.length == 7) {
        score += 50;
    }

    // Check that we are touching a tile or if it is the first move
    var someone_has_points = false;
    for (i in state.scores)
        if (state.scores[i] != 0)
            someone_has_points = true;
    if (!(touches_existing_tile || !someone_has_points)) {
        //console.log("Need to touch existing tile", ui_state.rack_tiles_on_board);
        return 0;
    }

    return score;
}

// object containing methods to add links/info to the page
var ui_add_items = {
    current_player : function() {
        var el = $('#current-player');
        var username = immutable_state.players[state.current_player].username;
        var tiles_left = (state === null ? '' :
                          ' - ' + state.tiles_left + ' tiles left');
        if (state.current_player == immutable_state.player_num)
            el.html('Your turn' + tiles_left);
        else
            el.html(username + "'s turn" + tiles_left);
    },

    winners : function() {
        function get_name(idx) {
            return immutable_state.players[state.winners[idx]].username;
        };
        function is_winner() {
            for (var i = 0; i < state.winners.length; i++)
                if (state.winners[i] == immutable_state.player_num)
                    return true;
            return false;
        };

        var el = $('#current-player');
        if (state.winners.length == 1) {
            if (is_winner())
                el.html('<p>Game over! You won!</p>');
            else
                el.html('<p>Game over! You lost. ' + get_name(0)
                        + ' won.</p>');
        } else {
            var winner_list = $('<ul></ul>');
            for (var i = 0; i < state.winners.length; i++)
                if (state.winners[i] != immutable_state.player_num)
                    winner_list.append('<li>' + get_name(i) + '</li>');
            if (is_winner()) {
                el.html('<p>Game over! You are a winner! You tied with:');
                el.append(winner_list);
                el.append('</p>');
            } else {
                el.html('<p>Game over! You lost! The winners are:');
                el.append(winner_list);
                el.append('</p>');
            }
        }
    },

    actions : function() {
        var actions = ['play', 'swap', 'pass'];
        var el = $("#actions");
        el.html('');
        for (var i = 0; i < 3; i++)
            el.append('<li><a href="javascript:' + actions[i] + '()">'
                      + actions[i] + '</a></li>');
    },

    generic_actions : function() {
        var el = $("#generic-actions");
        el.html('');
        el.append('<li><a href="javascript:recall_tiles()">recall</a></li>');
        el.append('<li><a href="javascript:shuffle_tiles()">shuffle</a></li>');
    },

    players : function() {
        var el = $('#players');
        el.html('');
        for (var i = 0; i < state.num_players; i++)
            el.append('<li>' + immutable_state.players[i].username
                      + ' - ' + state.scores[i] + '</li>');
    },

    add_items : function() {
        // Clear info fields
        $('#current-player').html('');
        $('#actions').html('');
        $('#generic-actions').html('');

        if (state.winners.length != 0) {
            this.winners();
        } else if (state.current_player == immutable_state.player_num) {
            this.current_player();
            this.actions();
            this.generic_actions();
        } else {
            this.current_player();
            this.generic_actions();
        }
        this.players();
    }
};



function get_state_success(resp) {
    var changed = state === null || state.turn != resp.turn;
    var my_turn = resp.current_player == immutable_state.player_num;
    error_sleep_time = 500; // Reset error sleep time
    if (changed && state !== null && my_turn) {
        var new_turn_snd = new Audio(new_turn_snd_b64);
        new_turn_snd.play();
        title_notification.notify('Your turn');
    }

    // Save order of tiles on rack
    var rack = state === null ? null : state.rack;

    ui_state.new_tiles = {};
    if (state !== null)
        for (var k in resp.board)
            if (!(k in state.board))
                ui_state.new_tiles[k] = true;

    state = resp;
    ui_add_items.add_items();

    var rack_has_changed = rack === null || (function () {
        var a = rack.slice();
        var b = state.rack.slice();

        if (a.length != b.length)
            return true;

        a.sort();
        b.sort();

        for (var i = 0; i < a.length; i++)
            if (a[i] != b[i])
                return true;
        return false;
    })();
    if (!rack_has_changed)
        state.rack = rack;

    if (rack_has_changed) {
        recall_tiles();
    } else {
        // Recall tiles on board which clash
        // Dunno if you can delete elements in list while you are iterating
        // over it. So storing the elements to delete in a separate list.
        var to_remove = [];
        for (k in ui_state.rack_tiles_on_board)
            if (k in state.board)
                to_remove.push([k, ui_state.rack_tiles_on_board[k]]);
        for (var i in to_remove) {
            delete ui_state.rack_tiles_on_board[to_remove[i][0]];
            delete ui_state.rack_tiles_on_board_idx[to_remove[i][1]];
        }
    }
    ui_state.score = calculate_score();

    board_image = undefined;
    ui_state.redraw = true;
}


function get_state_error(resp) {
    console.log("Poll error; sleeping for", error_sleep_time, "ms");
    window.setTimeout(notification_listener.get_state, error_sleep_time);
    error_sleep_time *= 2;
}


var notification_listener = {
    cursor: null,
    error_timer: null,
    error_sleep_time: 500,

    get_state: function() {
        $.ajax({url: urls.state,
                type: 'GET',
                dataType: 'json',
                data: {},
                success: get_state_success,
                error: get_state_error});
    },

    reset_error_timer: function(refetch) {
        this.error_sleep_time = 500;
        if (this.error_timer !== null) {
            console.log("reset timer while doing timeout");
            window.clearTimeout(this.error_timer);
            this.error_timer = null;

            if (refetch === true)
                window.setTimeout($.proxy(this, 'fetch'), 0);

            return true;
        }
        return false;
    },

    fetch: function() {
        var data = {};
        if (this.cursor !== null)
            data['cursor'] = this.cursor;

        $.ajax({url: urls.notification,
                type: 'GET',
                dataType: 'json',
                data: data,
                context: this,
                success: this.fetch_success,
                error: this.fetch_error});
    },

    fetch_success: function(resp) {
        this.reset_error_timer();
        this.cursor = resp.cursor;
        window.setTimeout($.proxy(this, 'fetch'), 0);

        if (state === null) {
            this.get_state();
        } else {
            // Check if a move occurred
            for (var i = 0; i < resp.notifications.length; i++) {
                if (resp.notifications[i][0] == 'm') {
                    this.get_state();
                    break;
                }
            }
        }

        // Add notifications to chat area
        var chatarea = $('#chatarea');
        var can_scroll = (chatarea[0].scrollHeight - chatarea.scrollTop()
                          == chatarea.outerHeight());
        for (var i = resp.notifications.length - 1; i >= 0; i--) {
            var notification = resp.notifications[i];
            var idx1 = notification.indexOf(':');
            var idx2 = notification.indexOf(':', idx1 + 1);
            var type = notification.substr(0, idx1);
            var pnum = parseInt(notification.substr(idx1+1, idx2 - idx1 - 1));
            var username = immutable_state.players[pnum].username;
            var msg = notification.substr(idx2+1);

            if (type == 'm') { // move
                chatarea.append('<div class="notification move">'
                                + username + ' ' + msg +
                               '</div>');
            } else if (type == 'c') {
                chatarea.append('<div class="notification chatmessage">'
                                + username + ': ' + msg +
                               '</div>');
            } else {
                console.log("Unexpected msg", notification);
            }
            chatarea.append('\n<hr />\n');
        }
        if (can_scroll)
            chatarea.animate({scrollTop: chatarea[0].scrollHeight});
    },

    fetch_error: function(resp) {
        console.log("Notification poll error; sleeping for",
                    this.error_sleep_time, "ms");
        this.error_timer = window.setTimeout($.proxy(this, 'fetch'),
                                             this.error_sleep_time);
        this.error_sleep_time *= 2;
    }
};

// Make CSRF work with AJAX in jquery
$('html').ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
        // Only send the token to relative URLs i.e. locally.
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});


var title_notification = {
    default_title: null,
    notification: null,
    on_notification: false,
    has_focus: true,
    interval_id: null,

    init: function() {
        this.default_title = $('title').text();
        $(window).focus($.proxy(this, 'focus_handler'));
        $(window).blur($.proxy(this, 'blur_handler'));
    },

    notify: function(text) {
        this.notification = text + ' :: ' + this.default_title;
        this.on_notification = false;
        if (!this.has_focus && this.interval_id === null)
            this.interval_id = setInterval($.proxy(this, 'update_title'),
                                           1000);
    },

    update_title: function() {
        if (this.on_notification)
            $('title').text(this.default_title);
        else
            $('title').text(this.notification);
        this.on_notification = !this.on_notification;
    },

    focus_handler: function(e) {
        this.has_focus = true;

        if (this.interval_id === null)
            return;

        clearInterval(this.interval_id);
        this.interval_id = null;
        $('title').text(this.default_title);
    },

    blur_handler: function(e) {
        this.has_focus = false;
    }
};


function init(urls_) {
    canvas = document.getElementById('canvas');

    // Test for canvas support
    if (canvas.getContext === undefined)
        return;

    ctx = canvas.getContext('2d');
    urls = urls_;
    title_notification.init();

    $.get(urls.immutable_state, {},
          function (resp) {
              immutable_state = resp;
              window.setTimeout($.proxy(notification_listener, 'fetch'), 0);
          });

    var supportsTouch = 'createTouch' in document;
    canvas[supportsTouch ? 'ontouchstart' : 'onmousedown'] = mouse_down;
    canvas[supportsTouch ? 'ontouchmove' : 'onmousemove']  = mouse_move;
    canvas[supportsTouch ? 'ontouchend' : 'onmouseup']  = mouse_up;
    canvas['onkeydown'] = key_down;

    setInterval(draw, 1000 / 60);
}
