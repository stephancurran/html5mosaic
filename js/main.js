/**
 *  HTML5 Mosaic
 *  
 *  Copyright © 2017 Stephan Curran
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *  
 */

var $canvas = $('#mosaicCanvas');                   // canvas : JQuery object
var $canvasDiv = $('#canvasDiv');                   // canvas Div : JQuery Object
var $multipleFileInput = $('#multipleFileInput');   // multiple file input: JQuery object
var singleFileInput = $('#singleFileInput')[0];     // single file input: NOT JQuery object
var $jsColour = $('#tileColour');                   // JS Color Picker: JQuery object
var ctx = $canvas[0].getContext('2d');              // canvas context
var $helpDialog = $('#dialog');                     // help dialog: JQuery object

/**
 * Objects that change during use
 * @type type
 */
var State = {
    tesserae: null, // array of tiles
    customShapeVertices: null, // array of vertices for the custom shape
    scale: null, // scale for new tiles
    sizeTriangle: null, // vertices for size button in toolbar
    openMode: null, // opening a save file or an image
    dragStartPoint: null, // where the cutline/select box begins
    centroid: null, // centroid of selected tiles
    activeTile: null, // tile currently clicked/dragged by mouse
    oldMousePos: null, // mouse position from previous event
    feedbackMessage: null, // feedback message text
    feedbackTimeout: null, // feedback message timeout

    customImagesVisible: null, // boolean to show user images
    filemenuVisible: null, // boolean to show FileMenu
    regularShapesVisible: null, // boolean to show regular shapes
    clipboardVisible: null, // boolean to show clipboard contents
    bgImageVisible: null, // boolean to show background image

    colourDropperMode: null, // boolean is colour dropper active
    ctrlDown: null, //boolean is CTRL pressed
    rotateMode: null, // boolean is rotate mode (Firefox)
    preventContextMenu: null, //boolean prevent context menu

    saved: true // is the current work saved
};

/**
 * The top level toolbar array and index numbers
 * @type type
 */
var Toolbar = {
    toolbarButtons: null, // array of top level toolbar buttons
    SIZE_BUTTON: -1, // size button
    NEW_TILE_BUTTON: -1, // new tile button
    SHOW_REGULAR_SHAPES_BUTTON: -1, // regular shapes dropdown button
    CUSTOM_SHAPE_BUTTON: -1, // custom shape button
    COLOUR_PICKER_BUTTON: -1, // colour picker/palette button
    COLOUR_DROPPER_BUTTON: -1, // colour dropper
    CLIPBOARD_BUTTON: -1, // clipboard
    SHOW_CLIPBOARD_BUTTON: -1, // clipboard dropdown
    USER_IMAGES_BUTTON: -1, // load user images button
    SHOW_CUSTOM_IMAGES_BUTTON: -1, // user images dropdown
    FLIP_VERTICAL_BUTTON: -1, // flip vertical button
    FLIP_HORIZONTAL_BUTTON: -1, // flip horizontal button
    UNDO_BUTTON: -1, // undo button
    REDO_BUTTON: -1, // redo button
    TRASH_BUTTON: -1, // trash button
    FILEMENU_BUTTON: -1, // show options button
    HELP_BUTTON: -1, // show options button
    HANDLE_BUTTON: -1                   // toolbar handle
};

/**
 * Regular shapes 
 * @type type
 */
var RegularShapes = {

    regularShapesSides: [4, 20, 3, 5, 6], // Create prototypes with these side counts (20 ~ circle)
    regularShapesPrototypes: null, // protoypes - these are copied and scaled to create new tiles
    regularShapesThumbnails: null, // one polygon for each shape to draw on toolbar
    regularShapesButtons: null              // one clickable toolbar button for each shape 
};

/**
 * The Clipboard data
 * @type type
 */
var Clipboard = {
    clipboard: null, // array of arrays, one for each of the following
    BUTTONS: 0, // toolbar buttons
    DELETE: 1, // delete button for each toolbar button
    THUMBNAILS: 2, // polygons to draw thumbnails of the copied tiles
    TILES: 3            //  fullsize copies of the tiles for reproduction
};

/**
 * Data for user images
 * @type type
 */
var ImageTiles = {
    buttons: null, // array of arrays, one for each of the following
    BUTTONS: 0, // toolbar buttons containing image thumbnail
    DELETE: 1           // delete button for each toolbar button
};

/**
 * Undo/Redo data
 * @type type
 */
var UndoRedo = {
    undoStack: null, // undo stack
    redoStack: null, // redo stack
    ADD: 0, // code for adding a tile
    DELETE: 1, // code for deleting a tile
    MOVE: 2, // code for moving/rotating a tile
    FLIP: 3, // code for flipping a tile
    CUSTOM: 4, // code for adding a custom shape
    COLOUR: 5 // code for changing colour
};

/**
 * Options menu
 * @type type
 */
var FileMenu = {
    buttons: null, // array of toolbar buttons
    OPEN: -1, // open file button
    SAVE: -1, // save file button
    BGIMAGE: -1, // load background image button
    CHECKBOX: -1, // checkbox button
    HELP: -1, // help button

    bgImage: null, // background image
    checkedImage: null, // checked checkbox image
    uncheckedImage: null    // unchecked checkbox image
};

/**
 * Unchanging startup Settings
 * @type type
 */
var Settings = {

    VERSION: 1, // version number of app
    RANDOM_TILE_MAX_SIDES: 5, // maximum number of sides on random tile
    RANDOM_TILE_MIN_SIDES: 3, //minmum number of sides on random tile
    RANDOM_TILE_WOBBLE: 10, // range to alter random tile vertices - from negative to positive this number

    TILE_SIZE: 20, // size of prototype tiles
    HANDLE_MARGIN: 5, //distance from toolbar buttons to edge of handle
    BUTTON_SIZE: 36, // size of toolbar buttons
    HALF_BUTTON_SIZE: 0, // half toolbar button size (frequently calculated otherwise)
    QUARTER_BUTTON_SIZE: 0, // quarter toolbar button size (frequently calculated otherwise)
    TOOLBAR_INITIAL_X: 10, // start coordinate of toolbar
    TOOLBAR_INITIAL_Y: 10, // start coordinate of toolbar
    MOVE_MODE: 1, // left button down
    ROTATE_MODE: 3, // right button down

    SCALE_MAX: 3, // maximum scale factor for new tiles
    SCALE_MIN: 0.5, // minimum scale factor for new tiles
    SCALE_RANGE: -1, // range of the scale
    ACTUAL_MAX: -1, //max input to scale algorithm (BUTTON_SIZE)
    ACTUAL_MIN: 0, // min input to scale algorithm (zero_
    ACTUAL_RANGE: -1, // range of input to scale algorithm

    CUSTOM_SHAPE_HOME_SIZE: 5, // proximity to check for closing custom shape
    CUSTOM_IMAGE_WARNING_SIZE: 80, // warning occurs if custom image is larger

    SELECTED_OUTLINE_COLOUR: '#FF0000', // outline color of selected tiles
    TOOLBARBUTTON_OUTLINE_COLOUR: '#000000', // outline colour of selected toolbar buttons
    TOOLBARBUTTON_BG_COLOUR: '#FFFFFF', // background colour of toolbar buttons
    BACKGROUND_COLOUR: '#FFFFFF', // background colour of canvas
    TOOLBAR_BG_COLOUR: '#000000', // colour of toolbar handle
    TOOLBAR_INNER_COLOUR: '#FFFFFF', // colour of toplevel toolbar button background
    GREYED_OUT: '#B8B8B8', // colour to grey out undo/redo buttons
    CUSTOM_SHAPE_CIRCLE_COLOUR: '#00FF00', // colour of custom shape 'home' point
    FEEDBACK_BACKGROUND_COLOUR: '#000000', // background colour of feedback message
    FEEDBACK_TEXT_COLOUR: '#FFFFFF', //text colour of feedback message

    FONT: '15px Arial', // feedback message font

    OPENMODE_FILE: 0, // opening a save file
    OPENMODE_IMAGE: 1, // opening an image

    SAVEFILE_EXTENSION: '.mosaic', //extension for save files
    DEFAULT_SAVE_FILENAME: '', // default file name for saves

    WIDTH: 600, //initial width of canvas
    HEIGHT: 400 // initial height of canvas
};

Settings.HALF_BUTTON_SIZE = Settings.BUTTON_SIZE / 2;
Settings.QUARTER_BUTTON_SIZE = Settings.BUTTON_SIZE / 4;
Settings.SCALE_RANGE = Settings.SCALE_MAX - Settings.SCALE_MIN;
Settings.ACTUAL_MAX = Settings.BUTTON_SIZE;
Settings.ACTUAL_RANGE = Settings.ACTUAL_MAX - Settings.ACTUAL_MIN;
Settings.DEFAULT_SAVE_FILENAME = 'mysave' + Settings.SAVEFILE_EXTENSION;

/**
 * Feedback messages
 * @type type
 */
var Messages = {

    NO_CROSSING: 'The edges cannot cross each other.',
    COPIED: 'Tiles copied to clipboard.',
    DELETED_FROM_CB: 'Tiles deleted from clipboard.',
    DELETED_FROM_USERIMAGES: 'Image deleted from user images.',
    CONFIRM_DELETE: 'This cannot be undone. Are you sure?',
    CUSTOM_IMAGE_WARNING: ' is quite large. Are you sure you want to load it?',
    LOSE_WORK_WARNING: 'You will lose your current work, including the clipboard contents. Continue?',
    CLEAR_CB_WARNING: 'This will also clear the clipboard. Continue?',
    TRASH_ONE: ' tile ',
    TRASH_MANY: ' tiles ',
    TRASHED: ' trashed.',
    WRONG_EXTENSION_WARNING: 'Wrong file extension.',
    X: ' x ', // for joining width and height in resize feedback message
    LOADED: ' loaded',
    EMPTY_CLIPBOARD_WARNING: 'The clipboard is currently empty.',
    EMPTY_USERIMAGE_WARNING: 'There are no user images loaded yet.'
};

var IconPaths = {

    dropdownIconPath: 'images/icon_dropdown.png',
    newTileIconPath: 'images/icon_newTile.png',
    userShapeIconPath: 'images/icon_userShape.png',
    paletteIconPath: 'images/icon_palette.png',
    dropperIconPath: 'images/icon_dropper.png',
    clipboardIconPath: 'images/icon_clipboard.png',
    customIconPath: 'images/icon_userImages.png',
    flipVIconPath: 'images/icon_flipV.png',
    flipHIconPath: 'images/icon_flipH.png',
    undoIconPath: 'images/icon_undo.png',
    redoIconPath: 'images/icon_redo.png',
    trashIconPath: 'images/icon_trash.png',
    filemenuIconPath: 'images/icon_filemenu.png',
    openIconPath: 'images/icon_open.png',
    saveIconPath: 'images/icon_save.png',
    bgImageIconPath: 'images/icon_bgImage.png',
    checkedIconPath: 'images/icon_checked.png',
    uncheckedIconPath: 'images/icon_unchecked.png',
    helpIconPath: 'images/icon_help.png'
};
/**
 * =============================================================================
 *                             PROTOTYPES
 * =============================================================================
 */

/**
 * Parent class for Buttons and Tiles
 * @param {Array} ver Vertices
 * @param {boolean} sel selected or not
 * @returns {Clickable}
 */
function Clickable(ver, sel)
{
    this.vertices = ver;
    this.isSelected = sel;
    this.image = null;
}

/**
 * returns true if the point is within this object's vertices
 * @param {Array} point
 * @returns {Boolean}
 */
Clickable.prototype.containsPoint = function (point)
{
    return Polygon.containsPoint(this.vertices, point);
};

/**
 * Sets the given Image as this object's image
 * @param {type} image
 * @returns {undefined}
 */
Clickable.prototype.setImage = function (image)
{
    this.image = image;
};

/**
 * ToolbarButton class
 * @param {Array} ver - Vertices
 * @param {boolean} sel - Selected or not (default to false)
 * @returns {ToolbarButton}
 */
function ToolbarButton(ver, sel = false)
{
    Clickable.call(this, ver, sel);

    this.image = null;
    this.thumbWidth = Settings.BUTTON_SIZE; // width/height of image (= BUTTON_SIZE for top level buttons)
    this.thumbHeight = Settings.BUTTON_SIZE; //
    this.thumbOffsetX = 0; // offsets to centre User Image button images (0 for top level buttons)
    this.thumbOffsetY = 0; //
}
ToolbarButton.prototype = Object.create(Clickable.prototype);
ToolbarButton.prototype.constructor = ToolbarButton;
ToolbarButton.prototype.colour = Settings.TOOLBARBUTTON_BG_COLOUR;

/**
 * Draw this button with the given context
 * @param {type} ctx
 */
ToolbarButton.prototype.draw = function (ctx)
{
    /* 
     * Background colour for non-top level buttons
     * (incidentally colours Custom Shape and Colour Dropper, but this doesn't affect appearance)
     */
    if (this.isSelected)
    {
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.vertices[0], this.vertices[1], this.vertices[2] - this.vertices[0], this.vertices[5] - this.vertices[3]);
    }

    /*
     * if this toolbar button has an image, draw it
     */
    if (this.image !== null)
    {
        ctx.drawImage(this.image, this.vertices[0] + this.thumbOffsetX, this.vertices[1] + this.thumbOffsetY, this.thumbWidth, this.thumbHeight);
    }

    /*
     * draw the outline of the button
     * */
    if (this.isSelected)
    {
        ctx.strokeStyle = Settings.TOOLBARBUTTON_OUTLINE_COLOUR;
        ctx.strokeRect(this.vertices[0], this.vertices[1], this.vertices[2] - this.vertices[0], this.vertices[5] - this.vertices[3]);
    }
};

/**
 * Set this button's image from a path
 * @param {String} path
 * @returns {undefined}
 */
ToolbarButton.prototype.setImageFromPath = function (path)
{
    this.image = new Image();
    this.image.onload = function ()
    {
        redraw();
    };
    this.image.src = path;
};

/**
 * Set the offset and scale for displaying the user image button
 * @returns {undefined}
 */
ToolbarButton.prototype.calculateThumbDetails = function ()
{
    var scale = Math.max(this.image.width, this.image.height) / Settings.BUTTON_SIZE;
    this.thumbWidth = this.image.width / scale;
    this.thumbHeight = this.image.height / scale;
    this.thumbOffsetX = (Settings.HALF_BUTTON_SIZE) - (this.thumbWidth / 2);
    this.thumbOffsetY = (Settings.HALF_BUTTON_SIZE) - (this.thumbHeight / 2);
};

/**
 * Return a new tile with the user image in the button
 * @param {type} mousePos
 * @returns {Tessera|.Object@call;create.createTileFromButton.tile|ToolbarButton.prototype.createTileFromButton.tile}
 */
ToolbarButton.prototype.createTileFromButton = function (mousePos)
{
    var x = mousePos[0] - (this.image.width / 2),
            y = mousePos[1] - (this.image.height / 2),
            vertices = [
                x, y,
                x + this.image.width, y,
                x + this.image.width, y + this.image.height,
                x, y + this.image.height
            ];
    var tile = new Tessera(vertices, this.colour);
    tile.setImage(this.image);
    return tile;
};

/**
 * This object represents the tiles (with image or without) which are manipulated on the canvas
 * @param {type} ver
 * @param {type} col
 * @returns {Tessera}
 */
function Tessera(ver, col)
{
    Clickable.call(this, ver, true);
    this.colour = col;  // this tile's colour
    this.image = null;      // this tile's image
    this.homeVertices = null;   // for resetting a tile and undoing movements
    this.flipped = false;       // needed to draw correctly when an image tile is flipped
    this.groupSize = 0; // used in a dummy tile to copy from clipboard
}
Tessera.prototype = Object.create(Clickable.prototype);
Tessera.prototype.constructor = Tessera;

/**
 * Draw this tile
 * @param {type} ctx
 * @returns {undefined}
 */
Tessera.prototype.draw = function (ctx)
{
    /*
     * Plain tile; draw the polygon
     */
    if (this.image === null)
    {
        ctx.beginPath();
        ctx.moveTo(this.vertices[0], this.vertices[1]);
        for (var i = 2; i < this.vertices.length - 1; i += 2)
        {
            ctx.lineTo(this.vertices[i], this.vertices[i + 1]);
        }
        ctx.closePath();
        ctx.fillStyle = this.colour;
        ctx.fill();
    } else
    {
        /*
         * An image tile; translate, rotate, and scale before drawing; undo afterwards
         */
        var angle = this.getAngle();

        ctx.translate(this.vertices[0], this.vertices[1]);
        ctx.rotate(angle);
        if (this.flipped)
        {
            ctx.scale(-1, 1);
        }

        ctx.drawImage(this.image, 0, 0);

        if (this.flipped)
        {
            ctx.scale(-1, 1);
        }
        ctx.rotate(-angle);
        ctx.translate(-this.vertices[0], -this.vertices[1]);

    }

    /*
     * draw an outline if the tile is selected
     */
    if (this.isSelected)
    {
        ctx.beginPath();
        ctx.moveTo(this.vertices[0], this.vertices[1]);
        for (var i = 2; i < this.vertices.length - 1; i += 2)
        {
            ctx.lineTo(this.vertices[i], this.vertices[i + 1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
};

/**
 * Calculate the angle of rotation of the tile from top-left and bottom-left corners
 * @returns {Number}
 */
Tessera.prototype.getAngle = function ()
{
    return Polygon.calculateAngle(this.vertices.slice(6, 8), [this.vertices[6], this.vertices[7] - 100], this.vertices.slice(0, 2));
};

/**
 * Mark this tile as flipped, and update home vertices
 * @returns {undefined}
 */
Tessera.prototype.flip = function ()
{
    this.flipped = !this.flipped;
    this.homeVertices = this.vertices.slice();
};

/**
 * returns if this tile has moved
 * @returns {.Object@call;create.hasMoved.moved|Boolean}
 */
Tessera.prototype.hasMoved = function ()
{
    var moved = false;

    if (this.homeVertices === null)
    {
        moved = true;
    } else
    {
        moved = !Polygon.equals(this.vertices, this.homeVertices);
    }
    return moved;
};

/**
 * return a clone of this tile, translated to [0,0]
 * @param {Array} shiftVector Distance to [0,0]
 * @returns {Tessera.prototype.clone.tile|Tessera|.Object@call;create.clone.tile}
 */
Tessera.prototype.clone = function (shiftVector)
{
    var verts = this.vertices.slice();
    Polygon.translate(verts, shiftVector);
    var tile = new Tessera(verts, this.colour);
    tile.setImage(this.image);
    tile.flipped = this.flipped;
    return tile;
};

/**
 * =============================================================================
 *                            Tile creation
 * =============================================================================
 */
var TileUtils = {};

/**
 * Calculate a regular polygon
 * @param {Array} centre Centre coords of the polygon
 * @param {integer} radius radius of the polygon
 * @param {integer} sideCount number of sides
 * @returns {TileUtils.calculateRegularVertices.vertices|Array}
 */
TileUtils.calculateRegularVertices = function (centre, radius, sideCount)
{
    var v = [centre[0], centre[1] - radius];

    if (sideCount === 4) /* make the square 'straight' for asthetics */
    {
        Polygon.rotate(v, centre, Polygon.degreesToRadians(45));
    }

    var angle = Polygon.degreesToRadians(360 / sideCount);
    var vertices = v.slice();
    for (var i = 1; i < sideCount; i++)
    {
        Polygon.rotate(v, centre, angle);
        vertices = vertices.concat(v);
    }

    return vertices;
};

/**
 * Return a new regular tile, using the regular protoype at index
 * @param {type} index Index of regularShapesPrototypes to use
 * @param {type} mousePos Where to centre the new tile
 * @returns {Tessera}
 */
TileUtils.createNewRegularTile = function (index, mousePos)
{
    var verts = RegularShapes.regularShapesPrototypes[index].slice();
    return TileUtils.createNewTile(verts, mousePos);
};

/**
 * Return a new tile with random vertices
 * @param {type} mousePos Where to centre the tile
 * @param {type} size
 * @returns {Tessera}
 */
TileUtils.createNewRandomTile = function (mousePos, size = Settings.TILE_SIZE)
{
    var verts = TileUtils.createRandomVertices(size);
    return TileUtils.createNewTile(verts, mousePos);
};

/**
 * Return a new tile with the given vertices translated to mousePos
 * @param {type} verts Prototype vertices to use
 * @param {type} mousePos Where to translate the tile to
 * @param {type} scale Scale to apply to vertices
 * @returns {Tessera}
 */
TileUtils.createNewTile = function (verts, mousePos, scale = State.scale)
{
    Polygon.scale(verts, scale);
    Polygon.translate(verts, mousePos);
    return new Tessera(verts, getNewTileColour());
};

/**
 * Create rendom vertices with approximate size
 * @param {type} size The starting size of the vertices
 * @param {type} centre Where to centre the vertices
 * @returns {Array|TileUtils.calculateRegularVertices.vertices|calculateRegularVertices.vertices}
 */
TileUtils.createRandomVertices = function (size, centre = [0, 0])
{
    var sides = Math.floor(Math.random() * (Settings.RANDOM_TILE_MAX_SIDES - Settings.RANDOM_TILE_MIN_SIDES + 1) + Settings.RANDOM_TILE_MIN_SIDES);
    var vertices = TileUtils.calculateRegularVertices(centre, size, sides);
    Polygon.rotate(vertices, centre, (Math.random() * 3) + 1);
    TileUtils.wobbleVertices(vertices, Settings.RANDOM_TILE_WOBBLE);
    return vertices;
};

/**
 * Randomly shift each vertex
 * @param {Array} vertices Vertices to wobble
 * @param {Integer} wobble Range of wobble (from negative value to positive value of this number)
 * @returns {undefined}
 */
TileUtils.wobbleVertices = function (vertices, wobble)
{
    for (var i = 0; i < vertices.length; i++)
    {
        vertices[i] += (Math.floor(Math.random() * wobble) + 1) * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
    }
};

/**
 * =============================================================================
 *                              INITIALISE
 * =============================================================================
 */
$(document).ready(function ()
{
    $canvasDiv.resizable(); // make the canvas Div resizable
    $jsColour.hide();   // hide the JS colour picker
    $helpDialog.dialog({
        width: 900,
        height: 300
    });
    $helpDialog.dialog('close');

    init_createToolbar(Settings.TOOLBAR_INITIAL_X, Settings.TOOLBAR_INITIAL_Y);

    setSize(Settings.QUARTER_BUTTON_SIZE); // initial input to scale 

    ctx.canvas.width = Settings.WIDTH; // initial canvas width
    ctx.canvas.height = Settings.HEIGHT;//initial canvas height

    reset();
});

/**
 * =============================================================================
 *                          CREATE TOOLBAR
 * =============================================================================
 */

/**
 * Initialise the toolbar buttons
 * @param {type} x Starting X coordinate
 * @param {type} y Starting Y coordinate
 * @returns {undefined}
 */
function init_createToolbar(x, y)
{
    Toolbar.toolbarButtons = new Array();

    /* preload this as 3 buttons use it */
    var dropdownImage = new Image();
    dropdownImage.src = IconPaths.dropdownIconPath;

    var sizeButton = new ToolbarButton(createHalfButtonVertices(x, y));
    x += Settings.HALF_BUTTON_SIZE;

    var newTileButton = new ToolbarButton(createButtonVertices(x, y));
    newTileButton.setImageFromPath(IconPaths.newTileIconPath, ctx);
    createRegularShapesButtons(x, y + Settings.BUTTON_SIZE);
    x += Settings.BUTTON_SIZE;

    var allShapesDropdown = new ToolbarButton(createHalfButtonVertices(x, y));
    allShapesDropdown.setImage(dropdownImage);
    setDropdownOffsets(allShapesDropdown);
    x += Settings.HALF_BUTTON_SIZE;

    var customShapeButton = new ToolbarButton(createButtonVertices(x, y));
    customShapeButton.setImageFromPath(IconPaths.userShapeIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var colourPickerButton = new ToolbarButton(createButtonVertices(x, y));
    colourPickerButton.setImageFromPath(IconPaths.paletteIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var colourDropperButton = new ToolbarButton(createButtonVertices(x, y));
    colourDropperButton.setImageFromPath(IconPaths.dropperIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var clipboardButton = new ToolbarButton(createButtonVertices(x, y));
    clipboardButton.setImageFromPath(IconPaths.clipboardIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var clipboardDropdown = new ToolbarButton(createHalfButtonVertices(x, y));
    clipboardDropdown.setImage(dropdownImage);
    setDropdownOffsets(clipboardDropdown);
    x += Settings.HALF_BUTTON_SIZE;

    var userImagesButton = new ToolbarButton(createButtonVertices(x, y));
    userImagesButton.setImageFromPath(IconPaths.customIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var customImagesDropdown = new ToolbarButton(createHalfButtonVertices(x, y));
    customImagesDropdown.setImage(dropdownImage);
    setDropdownOffsets(customImagesDropdown);
    x += Settings.HALF_BUTTON_SIZE;

    var flipVButton = new ToolbarButton(createButtonVertices(x, y));
    flipVButton.setImageFromPath(IconPaths.flipVIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var flipHButton = new ToolbarButton(createButtonVertices(x, y));
    flipHButton.setImageFromPath(IconPaths.flipHIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var undoButton = new ToolbarButton(createButtonVertices(x, y));
    undoButton.setImageFromPath(IconPaths.undoIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var redoButton = new ToolbarButton(createButtonVertices(x, y));
    redoButton.setImageFromPath(IconPaths.redoIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var trashButton = new ToolbarButton(createButtonVertices(x, y));
    trashButton.setImageFromPath(IconPaths.trashIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    var optionsButton = new ToolbarButton(createButtonVertices(x, y));
    optionsButton.setImageFromPath(IconPaths.filemenuIconPath, ctx);
    createFileMenuButtons(x, y + Settings.BUTTON_SIZE);
    x += Settings.BUTTON_SIZE;

    var helpButton = new ToolbarButton(createButtonVertices(x, y));
    helpButton.setImageFromPath(IconPaths.helpIconPath, ctx);
    x += Settings.BUTTON_SIZE;

    Toolbar.SHOW_REGULAR_SHAPES_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(allShapesDropdown);

    Toolbar.SHOW_CLIPBOARD_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(clipboardDropdown);

    Toolbar.NEW_TILE_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(newTileButton);

    Toolbar.SIZE_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(sizeButton);

    Toolbar.COLOUR_PICKER_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(colourPickerButton);

    Toolbar.COLOUR_DROPPER_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(colourDropperButton);

    Toolbar.CUSTOM_SHAPE_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(customShapeButton);

    Toolbar.CLIPBOARD_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(clipboardButton);

    Toolbar.USER_IMAGES_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(userImagesButton);

    Toolbar.SHOW_CUSTOM_IMAGES_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(customImagesDropdown);

    Toolbar.FLIP_VERTICAL_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(flipVButton);

    Toolbar.FLIP_HORIZONTAL_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(flipHButton);

    Toolbar.UNDO_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(undoButton);

    Toolbar.REDO_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(redoButton);

    Toolbar.TRASH_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(trashButton);

    Toolbar.FILEMENU_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(optionsButton);

    Toolbar.HELP_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(helpButton);

    var handleWidth = (15 * Settings.BUTTON_SIZE) + (Settings.HANDLE_MARGIN * 2);
    var handleHeight = Settings.BUTTON_SIZE + (Settings.HANDLE_MARGIN * 2);
    x = x - (15 * Settings.BUTTON_SIZE) - Settings.HANDLE_MARGIN;
    y = y - Settings.HANDLE_MARGIN;

    var handle = new ToolbarButton([
        x, y,
        x + handleWidth, y,
        x + handleWidth, y + handleHeight,
        x, y + handleHeight
    ]);
    handle.isSelected = false;
    Toolbar.HANDLE_BUTTON = Toolbar.toolbarButtons.length;
    Toolbar.toolbarButtons.push(handle);

    createRegularShapePrototypes();
    setSizeTriangleBase();
}

/**
 * The dropdown images need to be offset
 * @param {type} dd
 * @returns {undefined}
 */
function setDropdownOffsets(dd)
{
    dd.thumbWidth = 9;
    dd.thumbHeight = 9;
    dd.thumbOffsetX = 2;
    dd.thumbOffsetY = 14;
}

/**
 * Create the dropdown list of Regular Shape buttons
 * @param {type} x Starting X coordinate
 * @param {type} y Starting Y coordinate
 * @returns {undefined}
 */
function createRegularShapesButtons(x, y)
{
    RegularShapes.regularShapesThumbnails = new Array();
    RegularShapes.regularShapesButtons = new Array();

    for (var i = 0; i < RegularShapes.regularShapesSides.length; i++)
    {
        RegularShapes.regularShapesThumbnails.push(TileUtils.calculateRegularVertices([x + Settings.HALF_BUTTON_SIZE, y + Settings.HALF_BUTTON_SIZE], Settings.BUTTON_SIZE / 3, RegularShapes.regularShapesSides[i]));
        RegularShapes.regularShapesButtons.push(new ToolbarButton(createButtonVertices(x, y), true));
        y += Settings.BUTTON_SIZE;
    }
}

/**
 * Create the FileMenu buttons
 * @param {type} x
 * @param {type} y
 * @returns {undefined}
 */
function createFileMenuButtons(x, y)
{
    FileMenu.buttons = new Array();

    var openButton = new ToolbarButton(createButtonVertices(x, y));
    openButton.isSelected = true;
    openButton.setImageFromPath(IconPaths.openIconPath, ctx);
    y += Settings.BUTTON_SIZE;

    var saveButton = new ToolbarButton(createButtonVertices(x, y));
    saveButton.isSelected = true;
    saveButton.setImageFromPath(IconPaths.saveIconPath, ctx);
    y += Settings.BUTTON_SIZE;

    var bgImageButton = new ToolbarButton(createButtonVertices(x, y));
    bgImageButton.isSelected = true;
    bgImageButton.setImageFromPath(IconPaths.bgImageIconPath, ctx);

    var checkboxButton = new ToolbarButton(createButtonVertices(x + Settings.HALF_BUTTON_SIZE, y + Settings.HALF_BUTTON_SIZE, Settings.HALF_BUTTON_SIZE));
    checkboxButton.isSelected = false;
    checkboxButton.thumbWidth = Settings.HALF_BUTTON_SIZE;
    checkboxButton.thumbHeight = Settings.HALF_BUTTON_SIZE;
    y += Settings.BUTTON_SIZE;

    FileMenu.CHECKBOX = FileMenu.buttons.length;
    FileMenu.buttons.push(checkboxButton);

    FileMenu.OPEN = FileMenu.buttons.length;
    FileMenu.buttons.push(openButton);

    FileMenu.SAVE = FileMenu.buttons.length;
    FileMenu.buttons.push(saveButton);

    FileMenu.BGIMAGE = FileMenu.buttons.length;
    FileMenu.buttons.push(bgImageButton);

    FileMenu.checkedImage = new Image();
    FileMenu.checkedImage.src = IconPaths.checkedIconPath;
    FileMenu.uncheckedImage = new Image();
    FileMenu.uncheckedImage.src = IconPaths.uncheckedIconPath;
}

/**
 * Calculate the vertices for a button with top-left at [x,y]
 * @param {type} x Starting X coordinate
 * @param {type} y Starting Y coordinate
 * @param {type} size The size of the button
 * @returns {Array}
 */
function createButtonVertices(x, y, size = Settings.BUTTON_SIZE)
{
    return [
        x, y,
        x + size, y,
        x + size, y + size,
        x, y + size
    ];
}

/**
 * Calculate the vertices for a halfsize button with top-left at [x,y]
 * @param {type} x Starting X coordinate
 * @param {type} y Starting Y coordinate
 * @returns {Array}
 */
function createHalfButtonVertices(x, y)
{
    return [
        x, y,
        x + Settings.HALF_BUTTON_SIZE, y,
        x + Settings.HALF_BUTTON_SIZE, y + Settings.BUTTON_SIZE,
        x, y + Settings.BUTTON_SIZE
    ];
}

/**
 * Create the protoype vertices for Regular Shapes
 * @returns {undefined}
 */
function createRegularShapePrototypes()
{
    RegularShapes.regularShapesPrototypes = new Array();

    for (var i = 0; i < RegularShapes.regularShapesSides.length; i++)
    {
        RegularShapes.regularShapesPrototypes.push(TileUtils.calculateRegularVertices([0, 0], Settings.TILE_SIZE, RegularShapes.regularShapesSides[i]));
    }
}

/**
 * =============================================================================
 *                             EVENT LISTENERS
 * =============================================================================
 */

/**
 * Confirm leaving page if work not saved
 * @param {type} evt
 */
$(window).on('beforeunload', function (evt)
{
    if (!State.saved)
    {
        /* Firefox */
        if (!window.confirm())
        {
            evt.preventDefault();
            return false;
        }
        
        /* Chrome */
        return '';
    }
});

/**
 * mouse down event
 * @param {type} evt
 */
$canvas.mousedown(function (evt)
{
    $jsColour.hide();

    var mousePos = getMousePosition(evt);
    State.activeTile = getTileAt(mousePos);

    switch (evt.which)
    {
        case Settings.MOVE_MODE:
            leftButtonDown(mousePos, evt.ctrlKey);
            break;

        case Settings.ROTATE_MODE:
            State.rotateMode = true;
            rightButtonDown(mousePos);
            break;
    }

    State.oldMousePos = mousePos;
    redraw();
});

/**
 * mouse move event
 * @param {type} evt
 */
$canvas.mousemove(function (evt)
{
    var mousePos = getMousePosition(evt);

    if (State.rotateMode) /* Firefox workaround */
    {
        rightButtonMove(mousePos);
    } else
    {
        switch (evt.which)
        {
            case Settings.MOVE_MODE:
                leftButtonMove(mousePos, evt.ctrlKey);
                break;

            case Settings.ROTATE_MODE:
                rightButtonMove(mousePos);
                break;
        }
    }

    if (State.oldMousePos !== null && !Polygon.equals(State.oldMousePos, mousePos))
    {
        redraw();
    }

    State.oldMousePos = mousePos;
});

/**
 * mouse up event
 * @param {type} evt
 */
$canvas.mouseup(function (evt)
{
    var mousePos = getMousePosition(evt);

    switch (evt.which)
    {
        case Settings.MOVE_MODE:
            leftButtonUp(mousePos, evt.ctrlKey);
            break;

        case Settings.ROTATE_MODE:
            State.rotateMode = false;
            rightButtonUp(mousePos);
            break;
    }

    State.activeTile = null;
    State.oldMousePos = mousePos;
    redraw();
});

/**
 * Double click event
 * @param {type} evt
 */
$canvas.dblclick(function (evt)
{
    /* don't want any text selected; it messes with mousemove on the canvas */
    if (window.getSelection)
    {
        window.getSelection().removeAllRanges();
    } else if (document.selection)
    {
        document.selection.empty();
    }
});

/**
 * key down event
 * @param {type} evt
 */
$(document).keydown(function (evt)
{
    if (evt.ctrlKey)
    {
        switch (evt.which)
        {
            case 65: /* a - select all*/
                evt.preventDefault();
                selectAll();
                redraw();
                break;
            case 67: /* c - copy */
                evt.preventDefault();
                copyToClipboard();
                redraw();
                break;
            case 72: /* h - flip horizontal */
                evt.preventDefault();
                mirrorHorizontal();
                redraw();
                break;
            case 86: /* v - flip vertical */
                evt.preventDefault();
                mirrorVertical();
                redraw();
                break;
            case 90: /* z - undo */
                evt.preventDefault();
                undo();
                redraw();
                break;
            case 89: /* y - redo */
                evt.preventDefault();
                redo();
                redraw();
                break;
            case 83: /* s - save */
                evt.preventDefault();
                save();
                break;
            case 79: /* o - open */
                evt.preventDefault();
                open(Settings.OPENMODE_FILE);
                break;
        }
    } else
    {
        switch (evt.which)
        {
            case 46: /* delete key */
                evt.preventDefault();
                deleteTiles();
                redraw();
                break;
        }
    }
});

/**
 * context menu event
 * @param {type} evt
 */
$canvas.contextmenu(function (evt)
{
    if (State.preventContextMenu)
    {
        evt.preventDefault();
    } else
    {
        State.preventContextMenu = true;
        redraw(false);
    }
});

/**
 * resize event
 */
$canvasDiv.resize(function ()
{
    ctx.canvas.width = $(this).width();
    ctx.canvas.height = $(this).height();
    setFeedback(ctx.canvas.width + Messages.X + ctx.canvas.height);
    redraw();
});

/**
 * jscolur change event
 * @param {type} evt
 */
$jsColour.change(function (evt)
{
    Toolbar.toolbarButtons[Toolbar.COLOUR_PICKER_BUTTON].colour = getNewTileColour();
    redraw();
});

/**
 * multiple file input change event
 * @param {type} evt
 */
$multipleFileInput.change(function (evt)
{
    tools_loadCustomImages($multipleFileInput[0].files);
    $multipleFileInput[0].value = null;
});

/**
 * single file input change event
 * @param {type} evt
 */
singleFileInput.addEventListener('change', function (evt)
{
    if (this.files.length === 1)
    {
        var file = this.files[0];
        switch (State.openMode)
        {
            case Settings.OPENMODE_FILE:
                load(file);
                break;
            case Settings.OPENMODE_IMAGE:
                reset(true);
                break;
        }
    }
});

/**
 * =============================================================================
 *                                  RESET
 * =============================================================================
 */

/**
 * Reset all soft parameters; load background image if set
 * @param {type} bg is background image present in file input or not
 * @returns {Boolean}
 */
function reset(bg = false)
{
    if (State.tesserae !== null && State.tesserae.length > 0)
    {
        if (!window.confirm(Messages.LOSE_WORK_WARNING))
        {
            singleFileInput.value = null;
            return false;
        }
    } else if (Clipboard.clipboard !== null && Clipboard.clipboard[Clipboard.TILES].length > 0)
    {
        if (!window.confirm(Messages.CLEAR_CB_WARNING))
        {
            singleFileInput.value = null;
            return false;
        }
    }

    State.tesserae = new Array();
    State.customShapeVertices = null;
    State.dragStartPoint = null;
    State.centroid = null;
    State.activeTile = null;
    State.oldMousePos = null;
    State.feedbackMessage = null;
    State.feedbackTimeout = null;

    Clipboard.clipboard = new Array();
    Clipboard.clipboard.push(new Array()); /* BUTTONS */
    Clipboard.clipboard.push(new Array()); /* DELETE */
    Clipboard.clipboard.push(new Array()); /* TILES */
    Clipboard.clipboard.push(new Array()); /* THUMBNAILS */

    ImageTiles.buttons = new Array();
    ImageTiles.buttons.push(new Array()); /* BUTTONS */
    ImageTiles.buttons.push(new Array()); /* DELETE */

    UndoRedo.undoStack = new Array();
    UndoRedo.redoStack = new Array();

    State.clipboardVisible = false;
    State.regularShapesVisible = false;
    if (State.filemenuVisible === null)
    {
        State.filemenuVisible = false;
    }
    State.colourDropperMode = false;
    State.customImagesVisible = false;
    State.bgImageVisible = false;
    State.preventContextMenu = true;
    State.rotateMode = false;
    State.ctrlDown = false;

    FileMenu.bgImage = null;

    if (bg)
    {
        var backgroundImageFiles = singleFileInput.files;
        if (backgroundImageFiles.length === 1)
        {
            loadImage(backgroundImageFiles[0], function ()
            {
                FileMenu.bgImage = this;
                State.bgImageVisible = true;
                ctx.canvas.width = this.width;
                ctx.canvas.height = this.height;
                $canvasDiv.width(this.width);
                $canvasDiv.height(this.height);
                $canvasDiv.resizable('destroy');
                $canvasDiv.resizable({aspectRatio: true});
                redraw();
            });
        }
    } else
    {
        $canvasDiv.width(ctx.canvas.width);
        $canvasDiv.height(ctx.canvas.height);
        $canvasDiv.resizable('destroy');
        $canvasDiv.resizable();
        singleFileInput.value = null;
        redraw();
    }

    return true;
}

/**
 * =============================================================================
 *                            CONTROL FUNCTIONS
 * =============================================================================
 */

/**
 * Handle left mouse button down
 * @param {Array} mousePos Mouse position
 * @param {boolean} ctrlKey is CTRL pressed
 */
function leftButtonDown(mousePos, ctrlKey)
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        deselectAll();

        /* custom shape being created */
        if (State.customShapeVertices !== null)
        {
            tools_customShape(mousePos);
        }
        /* maybe starting to drag a cut line or select box */
        else
        {
            State.dragStartPoint = mousePos;
        }
    }
    /* Toolbar button */
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* deactivate colour dropper if active tile isn't dropper or picker */
        if (State.activeTile !== Toolbar.toolbarButtons[Toolbar.COLOUR_DROPPER_BUTTON] &&
                State.activeTile !== Toolbar.toolbarButtons[Toolbar.COLOUR_PICKER_BUTTON])
        {
            setColourDropperMode(false);
        }

        /* deactivate custom shape button */
        if (State.activeTile !== Toolbar.toolbarButtons[Toolbar.CUSTOM_SHAPE_BUTTON])
        {
            setCustomShapeMode(false);
        }

        /* new random tile button */
        if (State.activeTile === Toolbar.toolbarButtons[Toolbar.NEW_TILE_BUTTON])
        {
            deselectAll();
            State.activeTile = TileUtils.createNewRandomTile(mousePos);
        }
        /* Size button */
        else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON])
        {
            setSize(Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices[5] - mousePos[1]);
        }
        /* not one of the top level buttons that matter for mouse down - check second level buttons */
        else
        {
            /* check the clipboard */
            var index = Clipboard.clipboard[Clipboard.BUTTONS].indexOf(State.activeTile);
            if (index > -1)
            {
                deselectAll();
                copyFromClipboard(index, mousePos);
            }
            /* check the regular shape buttons */
            else
            {
                index = RegularShapes.regularShapesButtons.indexOf(State.activeTile);
                if (index > -1)
                {
                    deselectAll();
                    State.activeTile = TileUtils.createNewRegularTile(RegularShapes.regularShapesButtons.indexOf(State.activeTile), mousePos);
                }
                /* check user image buttons */
                else
                {
                    index = ImageTiles.buttons[ImageTiles.BUTTONS].indexOf(State.activeTile);
                    if (index > -1)
                    {
                        deselectAll();
                        State.activeTile = State.activeTile.createTileFromButton(mousePos);
                    }
                }
            }

        }
    }
    /* pre-existing tile */
    else if (State.activeTile instanceof Tessera)
    {
        /* flip selection of tile if CTRL is pressed*/
        if (ctrlKey)
        {
            State.activeTile.isSelected = !State.activeTile.isSelected;
        }
        /* if not selected, clear selected, and select this one */
        else if (!State.activeTile.isSelected)
        {
            deselectAll();
            State.activeTile.isSelected = true;
        }

        /* update this tiles home vertices - it may be about to move */
        State.activeTile.homeVertices = State.activeTile.vertices.slice();
    }
}

/**
 * Mouse is moved with left button down
 * @param {type} mousePos Current mouse position
 * @param {type} ctrlKey Is Control key pressed
 * @returns {undefined}
 */
function leftButtonMove(mousePos, ctrlKey)
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        /* store the state of the CTRL key */
        State.ctrlDown = ctrlKey;
    }
    /* Toolbar button */
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* toolbar handle */
        if (State.activeTile === Toolbar.toolbarButtons[Toolbar.HANDLE_BUTTON])
        {
            moveToolbar(Polygon.getShiftVector(mousePos, State.oldMousePos));
        }
        /* size button */
        else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON])
        {
            /* only set size while mouse is within size button*/
            if (Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].containsPoint(mousePos))
            {
                setSize(Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices[5] - mousePos[1]);
            }
        }
    }
    /* pre-existing tile; this means that selected tiles are moving */
    else if (State.activeTile instanceof Tessera)
    {
        /* new tile, and not a group from the clipboard*/
        if (State.activeTile.homeVertices === null && State.activeTile.groupSize === 0)
        {
            Polygon.translate(State.activeTile.vertices, Polygon.getShiftVector(mousePos, State.oldMousePos));
        }
        /* move all selected tiles */
        else
        {
            tools_move(Polygon.getShiftVector(mousePos, State.oldMousePos), State.tesserae);
        }
    }
}

/**
 * left mouse button released
 * @param {type} mousePos
 * @param {type} ctrlKey
 * @returns {undefined}
 */
function leftButtonUp(mousePos, ctrlKey)
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        if (State.dragStartPoint !== null)
        {
            /* select box drawn */
            if (ctrlKey)
            {
                tools_select(State.dragStartPoint, mousePos);
            }
            /* cut line drawn */
            else
            {
                tools_cut(State.dragStartPoint, mousePos);
            }
        }
    }
    /* Toolbar button*/
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* Only perform action if mouse is still over the active tile */
        if (State.activeTile.containsPoint(mousePos))
        {
            /* Show/hide Clipboard contents */
            if (State.activeTile === Toolbar.toolbarButtons[Toolbar.SHOW_CLIPBOARD_BUTTON])
            {
                if (Clipboard.clipboard[Clipboard.TILES].length > 0)
                {
                    State.clipboardVisible = !State.clipboardVisible;
                } else
                {
                    setFeedback(Messages.EMPTY_CLIPBOARD_WARNING);
                }
            }
            /* Show/hide Regular shapes */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.SHOW_REGULAR_SHAPES_BUTTON])
            {
                State.regularShapesVisible = !State.regularShapesVisible;
            }
            /* show the Colour picker */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.COLOUR_PICKER_BUTTON])
            {
                $jsColour.show();
                $jsColour.css({left: mousePos[0], top: mousePos[1]});
                $jsColour[0].jscolor.show();
            }
            /* Activate/deactivate colour dropper */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.COLOUR_DROPPER_BUTTON])
            {
                setColourDropperMode(!State.colourDropperMode);
            }
            /* activate/deactivate custom shape tool */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.CUSTOM_SHAPE_BUTTON])
            {
                setCustomShapeMode(!Toolbar.toolbarButtons[Toolbar.CUSTOM_SHAPE_BUTTON].isSelected);
            }
            /* open the multiple file input for user images */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.USER_IMAGES_BUTTON])
            {
                $multipleFileInput.click();
            }
            /* show/hide user images */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.SHOW_CUSTOM_IMAGES_BUTTON])
            {
                if (ImageTiles.buttons[ImageTiles.BUTTONS].length > 0)
                {
                    State.customImagesVisible = !State.customImagesVisible;
                } else
                {
                    setFeedback(Messages.EMPTY_USERIMAGE_WARNING);
                }
            }
            /* flip selected tiles vertically */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.FLIP_VERTICAL_BUTTON])
            {
                mirrorVertical();
            }
            /* flip selected tiles horizontally */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.FLIP_HORIZONTAL_BUTTON])
            {
                mirrorHorizontal();
            }
            /* undo last action */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.UNDO_BUTTON])
            {
                undo();
            }
            /* redo next action */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.REDO_BUTTON])
            {
                redo();
            }
            /* help button */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.HELP_BUTTON])
            {
                if ($helpDialog.dialog('isOpen') === true)
                {
                    $helpDialog.dialog('close');
                } else
                {
                    $helpDialog.dialog('open');
                }
            }
            /* show/hide file menu */
            else if (State.activeTile === Toolbar.toolbarButtons[Toolbar.FILEMENU_BUTTON])
            {
                State.filemenuVisible = !State.filemenuVisible;
            }
            /* open a save file */
            else if (State.activeTile === FileMenu.buttons[FileMenu.OPEN])
            {
                open(Settings.OPENMODE_FILE);
            }
            /* save current project */
            else if (State.activeTile === FileMenu.buttons[FileMenu.SAVE])
            {
                save();
            }
            /* load background image */
            else if (State.activeTile === FileMenu.buttons[FileMenu.BGIMAGE])
            {
                open(Settings.OPENMODE_IMAGE);
            }
            /* show/hide background image */
            else if (State.activeTile === FileMenu.buttons[FileMenu.CHECKBOX]
                    && State.activeTile.image !== null)
            {
                State.bgImageVisible = !State.bgImageVisible;
            }
            /* it wasn't the main toolbar; check delete buttons */
            else
            {
                /* check the clipboard deletes */
                var index = Clipboard.clipboard[Clipboard.DELETE].indexOf(State.activeTile);
                if (index > -1)
                {
                    if (window.confirm(Messages.CONFIRM_DELETE))
                    {
                        State.clipboardVisible = deleteFromToolbar(index, Clipboard.clipboard, Messages.DELETED_FROM_CB);
                    }
                }
                /* check user image deletes */
                else
                {
                    index = ImageTiles.buttons[ImageTiles.DELETE].indexOf(State.activeTile);
                    if (index > -1)
                    {
                        if (window.confirm(Messages.CONFIRM_DELETE))
                        {
                            State.customImagesVisible = deleteFromToolbar(index, ImageTiles.buttons, Messages.DELETED_FROM_USERIMAGES);
                        }
                    }
                }
            }
        }
    }
    /* existing tile */
    else if (State.activeTile instanceof Tessera)
    {
        /* changing the tiles colour */
        if (State.colourDropperMode && !State.activeTile.hasMoved() && State.activeTile.containsPoint(mousePos))
        {
            pushToUndoStack([[UndoRedo.COLOUR, [State.activeTile, State.activeTile.colour, getNewTileColour()]]]);
            State.activeTile.colour = getNewTileColour();
        }
        /* mouse is over the trashcan button; delete selected tiles */
        else if (Toolbar.toolbarButtons[Toolbar.TRASH_BUTTON].containsPoint(mousePos))
        {
            deleteTiles();
        }
        /* mouse is over the clipboard button; copy selected to clipboard */
        else if (Toolbar.toolbarButtons[Toolbar.CLIPBOARD_BUTTON].containsPoint(mousePos))
        {
            copyToClipboard();
        } else
        {
            /* new tile, and not group from clipboard */
            if (State.activeTile.homeVertices === null && State.activeTile.groupSize === 0)
            {
                /*
                 * update home vertices and add to Tesserae array
                 */
                State.activeTile.homeVertices = State.activeTile.vertices.slice();
                State.tesserae.push(State.activeTile);
                pushToUndoStack([[UndoRedo.ADD, [State.activeTile, State.activeTile.homeVertices, State.activeTile.vertices]]]);
            }
            /* existing tile, or group from clipboard */
            else
            {
                /* no movement, deselect all tiles and select this one */
                if (!State.activeTile.hasMoved() && !ctrlKey)
                {
                    deselectAll();
                    State.activeTile.isSelected = true;
                }
                /* tiles were moved; update home vertices */
                else if (State.activeTile.hasMoved())
                {
                    updateHomeVertices(State.activeTile.groupSize > 0);
                }
            }
        }
    }

    State.dragStartPoint = null;
}

/**
 * Right mouse button down
 * @returns {undefined}
 */
function rightButtonDown()
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        /* if in Custom Shape mode, remove last vertex */
        if (State.customShapeVertices !== null && State.customShapeVertices.length >= 2)
        {
            State.customShapeVertices.splice(State.customShapeVertices.length - 2);
        }
    }
    /* toolbar button */
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* toolbar is not affected by right click */
    }
    /* existing tile */
    else if (State.activeTile instanceof Tessera)
    {
        /* not selected; deselect others, and select this */
        if (!State.activeTile.isSelected)
        {
            deselectAll();
            State.activeTile.isSelected = true;
        }
        /* prepare to rotate tiles by setting centroid of selected */
        State.centroid = Polygon.calculateCentroid(calculateBoundingBoxForSelected());
    }
}

/**
 * Right button move
 * @param {type} mousePos
 * @returns {undefined}
 */
function rightButtonMove(mousePos)
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        /* nothing to do */
    }
    /* Toolbar button */
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* nothing to do */
    }
    /* existing tile */
    else if (State.activeTile instanceof Tessera)
    {
        tools_rotate(State.centroid, Polygon.calculateAngle(State.centroid, mousePos, State.oldMousePos));
    }
}

/**
 * Right button up
 * @param {type} mousePos
 * @returns {undefined}
 */
function rightButtonUp(mousePos)
{
    /* empty canvas clicked */
    if (State.activeTile === null)
    {
        /* if not drawing a custom shape */
        if (State.customShapeVertices === null)
        {
            deselectAll();
            State.preventContextMenu = false;
        }
    }
    /* toolbar button */
    else if (State.activeTile instanceof ToolbarButton)
    {
        /* nothing to do */
    }
    /* existing tile */
    else if (State.activeTile instanceof Tessera)
    {
        /* colour dropper mode and active tile hasn't been rotated */
        if (State.colourDropperMode && !State.activeTile.hasMoved())
        {
            setNewTileColour(State.activeTile.colour);
        }
        /* tiles were rotated; update home vertices */
        else
        {
            if (State.activeTile.hasMoved())
            {
                updateHomeVertices();
            }
        }
    }

    State.centroid = null;
}

/**
 * =============================================================================
 *                              UNDO/REDO
 * =============================================================================
 */

/**
 * Push the given command to the undoStack
 * @param {Array} command An array of actions
 */
function pushToUndoStack(command)
{
    if (command.length > 0)
    {
        UndoRedo.redoStack = new Array();
        UndoRedo.undoStack.push(command);
        State.saved = false;
    }
}

/**
 * undo the last command
 */
function undo()
{
    /* deactivate Custom Shape mode - no redo */
    if (State.customShapeVertices !== null)
    {
        setCustomShapeMode(false);
    } else if (UndoRedo.undoStack.length > 0)
    {
        deselectAll();
        var command = UndoRedo.undoStack.pop();
        for (var i = 0; i < command.length; i++)
        {
            undoAction(command[i]);
        }
        UndoRedo.redoStack.push(command);
        State.saved = false;
    }
}

/**
 * Undo the given action
 * @param {array} act Array containg action code, plus relevant data
 */
function undoAction(act)
{
    var action = act[0];
    var data = act[1];

    switch (action)
    {
        case UndoRedo.CUSTOM:
        case UndoRedo.ADD:
            State.tesserae.splice(State.tesserae.indexOf(data[0]), 1);
            if (data[0] === State.activeTile)
            {
                State.activeTile = null;
            }
            break;
        case UndoRedo.DELETE:
            State.tesserae.push(data[0]);
            break;
        case UndoRedo.FLIP:
            data[0].flip();
        case UndoRedo.MOVE:
            data[0].vertices = data[1].slice();
            data[0].homeVertices = data[1].slice();
            break;
        case UndoRedo.COLOUR:
            data[0].colour = data[1];
            break;
    }
}

/**
 * Redo the last command
 */
function redo()
{
    if (UndoRedo.redoStack.length > 0)
    {
        deselectAll();
        var command = UndoRedo.redoStack.pop();
        for (var i = 0; i < command.length; i++)
        {
            redoAction(command[i]);
        }
        UndoRedo.undoStack.push(command);
        State.saved = false;
    }
}

/**
 * Redo the given action
 * @param {type} act Array containg action code, plus relevant data
 */
function redoAction(act)
{
    var action = act[0];
    var data = act[1];

    switch (action)
    {
        case UndoRedo.CUSTOM:
        case UndoRedo.ADD:
            State.tesserae.push(data[0]);
            break;
        case UndoRedo.DELETE:
            State.tesserae.splice(State.tesserae.indexOf(data[0]), 1);
            break;
        case UndoRedo.FLIP:
            data[0].flip();
        case UndoRedo.MOVE:
            data[0].vertices = data[2].slice();
            data[0].homeVertices = data[2].slice();
            break;
        case UndoRedo.COLOUR:
            data[0].colour = data[2];
            break;
    }
}

/**
 * =============================================================================
 *                           GETTERS/SETTERS
 * =============================================================================
 */

/**
 * Set colour dropper mode
 * @param {boolean} on True or False
 */
function setColourDropperMode(on)
{
    State.colourDropperMode = on;
    Toolbar.toolbarButtons[Toolbar.COLOUR_DROPPER_BUTTON].isSelected = on;
}

/**
 * Set Custom Shape mode
 * @param {boolean} on True or False
 */
function setCustomShapeMode(on)
{
    Toolbar.toolbarButtons[Toolbar.CUSTOM_SHAPE_BUTTON].isSelected = on;

    if (on)
    {
        State.customShapeVertices = new Array();
    } else
    {
        State.customShapeVertices = null;
    }
}

/**
 * Set the scale for new tiles
 * (Based on BUTTON_SIZE)
 * @param {number} actualValue 
 */
function setSize(actualValue)
{
    State.scale = (((actualValue - Settings.ACTUAL_MIN) * Settings.SCALE_RANGE) / Settings.ACTUAL_RANGE + Settings.SCALE_MIN);
}

/**
 * Get the HEX colour code to give new tiles
 * @returns {String}
 */
function getNewTileColour()
{
    return $jsColour[0].jscolor.toHEXString();
}

/**
 * Set the HEX value for new tiles
 * @param {String} colour A HEX colour code starting with #
 */
function setNewTileColour(colour)
{
    /* need to remove the # */
    $jsColour[0].jscolor.fromString(colour.substring(1));
}

/**
 * Return the background colour setting
 * @returns {String}
 */
function getBackgroundColour()
{
    return Settings.BACKGROUND_COLOUR;
}

/**
 * Returns the first selected tile from Tesserae; null if none are selected
 * @returns {Tessera}
 */
function getFirstSelectedTile()
{
    var tile = null;

    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            tile = State.tesserae[i];
            break;
        }
    }

    return tile;
}

/**
 * Return coords for the current mouse position on the canvas
 * @param {type} evt
 * @returns {Array}
 */
function getMousePosition(evt)
{
    var rect = $canvas[0].getBoundingClientRect();
    var x = (evt.clientX - rect.left) / (rect.right - rect.left) * $canvas.width();
    var y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * $canvas.height();
    return [x, y];
}

/**
 * return the Tessera/ToolbarButton under the mouse; null if none
 * @param {type} mousePos
 * @returns {Clipboard..clipboard|ImageTiles..buttons}
 */
function getTileAt(mousePos)
{
    var tile = null;

    /* check the regular shapes dropdown */
    if (State.regularShapesVisible)
    {
        for (var i = 0; i < RegularShapes.regularShapesButtons.length; i++)
        {
            if (RegularShapes.regularShapesButtons[i].containsPoint(mousePos))
            {
                tile = RegularShapes.regularShapesButtons[i];
                break;
            }
        }
    }

    if (tile === null && State.clipboardVisible)
    {
        /* check the clipboard delete button */
        for (var i = 0; i < Clipboard.clipboard[Clipboard.DELETE].length; i++)
        {
            if (Clipboard.clipboard[Clipboard.DELETE][i].containsPoint(mousePos))
            {
                tile = Clipboard.clipboard[Clipboard.DELETE][i];
                break;
            }
        }
        /* check the clipboard buttons */
        if (tile === null)
        {
            for (var i = 0; i < Clipboard.clipboard[Clipboard.BUTTONS].length; i++)
            {
                if (Clipboard.clipboard[Clipboard.BUTTONS][i].containsPoint(mousePos))
                {
                    tile = Clipboard.clipboard[Clipboard.BUTTONS][i];
                    break;
                }
            }
        }
    }

    if (tile === null && State.customImagesVisible)
    {
        /* check the user image delete buttons */
        for (var i = 0; i < ImageTiles.buttons[ImageTiles.DELETE].length; i++)
        {
            if (ImageTiles.buttons[ImageTiles.DELETE][i].containsPoint(mousePos))
            {
                tile = ImageTiles.buttons[ImageTiles.DELETE][i];
                break;
            }
        }
        /* check the user image buttons */
        if (tile === null)
        {
            for (var i = 0; i < ImageTiles.buttons[ImageTiles.BUTTONS].length; i++)
            {
                if (ImageTiles.buttons[ImageTiles.BUTTONS][i].containsPoint(mousePos))
                {
                    tile = ImageTiles.buttons[ImageTiles.BUTTONS][i];
                    break
                }
            }
        }
    }

    /* check the file menu */
    if (tile === null && State.filemenuVisible)
    {
        for (var i = (FileMenu.bgImage === null ? 1 : 0); i < FileMenu.buttons.length; i++)
        {
            if (FileMenu.buttons[i].containsPoint(mousePos))
            {
                tile = FileMenu.buttons[i];
                break;
            }
        }
    }

    /* check the  top level toolbar buttons*/
    if (tile === null)
    {
        for (var i = 0; i < Toolbar.toolbarButtons.length; i++)
        {
            if (Toolbar.toolbarButtons[i].containsPoint(mousePos))
            {
                tile = Toolbar.toolbarButtons[i];
                break;
            }
        }
    }

    /* check the Tesserae */
    if (tile === null)
    {
        for (var i = 0; i < State.tesserae.length; i++)
        {
            if (State.tesserae[i].containsPoint(mousePos))
            {
                tile = State.tesserae[i];
                break;
            }
        }
    }

    return tile;
}

/**
 * Load the given image file, and use the given function for its onLoad event
 * @param {type} file A file
 * @param {type} onloadFunction A function
 */
function loadImage(file, onloadFunction)
{
    var reader = new FileReader();
    var image;
    reader.onload = function (evt)
    {
        image = new Image();
        image.name = file.name;
        image.onload = onloadFunction;
        image.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Set vertices of selected tiles back to home vertices
 */
function resetVertices()
{
    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            State.tesserae[i].vertices = State.tesserae[i].homeVertices.slice();
        }
    }
}

/**
 * Set home vertices as copies of vertices
 * @param {boolean} fromCB Are the tiles from the clipboard? (Different undo command required)
 */
function updateHomeVertices(fromCB = false)
{
    var undoCommand = new Array();
    var action;

    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            if (fromCB)
            {
                action = [UndoRedo.ADD, [State.tesserae[i]]];
            } else
            {
                action = [UndoRedo.MOVE, [State.tesserae[i], State.tesserae[i].homeVertices.slice(), State.tesserae[i].vertices.slice()]];
            }

            undoCommand.push(action);
            State.tesserae[i].homeVertices = State.tesserae[i].vertices.slice();
        }
    }

    pushToUndoStack(undoCommand);
}

/**
 * Select all tiles
 */
function selectAll()
{
    for (var i = 0; i < State.tesserae.length; i++)
    {
        State.tesserae[i].isSelected = true;
    }
}

/**
 * Deselect all tiles
 */
function deselectAll()
{
    for (var i = 0; i < State.tesserae.length; i++)
    {
        State.tesserae[i].isSelected = false;
    }
}

/**
 * =============================================================================
 *                              CUSTOM SHAPE
 * =============================================================================
 */

/**
 * Tries to add new vertex to custom shape, or to close it
 * Makes sure edges don't cross
 * @param {Array} mousePos Mouse position of click
 */
function tools_customShape(mousePos)
{
    /* less than 3 vertices; can safely add another */
    if (State.customShapeVertices.length < 6)
    {
        State.customShapeVertices = State.customShapeVertices.concat(mousePos);
    } else
    {
        /* trying to close shape */
        if (Polygon.distance(State.customShapeVertices.slice(0, 2), mousePos) < Settings.CUSTOM_SHAPE_HOME_SIZE)
        {
            var edges = Polygon.getEdges(State.customShapeVertices.concat(mousePos)).slice(1);
            /* no crossing edges; create new tile */
            if (Polygon.isSimpleEdges(edges))
            {
                var undoCommand = new Array();

                var tile = new Tessera(State.customShapeVertices, getNewTileColour());
                tile.homeVertices = tile.vertices.slice();
                State.tesserae.push(tile);

                undoCommand.push([UndoRedo.CUSTOM, [tile]]);
                State.customShapeVertices = new Array();

                pushToUndoStack(undoCommand);
            }
            /* edges crossing */
            else
            {
                setFeedback(Messages.NO_CROSSING);
            }
        }
        /* adding a vertex */
        else
        {
            var edges = Polygon.getEdges(State.customShapeVertices.concat(mousePos));
            edges.splice(edges.length - 1);
            var isSimple = Polygon.isSimpleEdges(edges);

            /* if no edges crossing, add vertex */
            if (isSimple)
            {
                State.customShapeVertices = State.customShapeVertices.concat(mousePos);
            }
            /* crossing edges */
            else
            {
                setFeedback(Messages.NO_CROSSING);
            }
        }
    }
}

/**
 * =============================================================================
 *                              MOVING
 * =============================================================================
 */

/**
 * Move the given tiles/toolbar buttons
 * @param {array} shiftVector The amount by which to move them
 * @param {array} clickables The tiles/toolbar buttons
 */
function tools_move(shiftVector, clickables)
{
    for (var i = 0; i < clickables.length; i++)
    {
        if (clickables[i].isSelected || clickables[i] instanceof ToolbarButton)
        {
            Polygon.translate(clickables[i].vertices, shiftVector);
        }
    }
}

/**
 * Move the various parts of the toolbar
 * @param {array} shiftVector The amount to move it by
 */
function moveToolbar(shiftVector)
{
    tools_move(shiftVector, Toolbar.toolbarButtons);
    tools_move(shiftVector, RegularShapes.regularShapesButtons);
    tools_move(shiftVector, Clipboard.clipboard[Clipboard.BUTTONS]);
    tools_move(shiftVector, Clipboard.clipboard[Clipboard.DELETE]);
    tools_move(shiftVector, ImageTiles.buttons[ImageTiles.BUTTONS]);
    tools_move(shiftVector, ImageTiles.buttons[ImageTiles.DELETE]);
    tools_move(shiftVector, FileMenu.buttons);

    moveRegularShapeThumbnails(shiftVector, RegularShapes.regularShapesThumbnails);

    setSizeTriangleBase();
}

/**
 * Move the Regular Shape thumbnails
 * @param {array} shiftVector The amount by which to move them
 * @param {array} thumbs The thumbnails to move
 */
function moveRegularShapeThumbnails(shiftVector, thumbs)
{
    for (var i = 0; i < thumbs.length; i++)
    {
        Polygon.translate(thumbs[i], shiftVector);
    }
}

/**
 * Set the size triangle
 * Bottom is halfway along the lower edge of the size button
 * Top corners are the top corners of the size button 
 */
function setSizeTriangleBase()
{
    var bottom = [Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices[0] + (Settings.QUARTER_BUTTON_SIZE), Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices[7]];
    State.sizeTriangle =
            bottom.slice()
            .concat(Polygon.getShiftVector(Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices.slice(0, 2), bottom))
            .concat(Polygon.getShiftVector(Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices.slice(2, 4), bottom));
}

/**
 * =============================================================================
 *                              ROTATING
 * =============================================================================
 */

/**
 * Rotate the selected tiles
 * @param {array} centroid The centre of rotation
 * @param {number} angle the angle of rotation in Radians
 */
function tools_rotate(centroid, angle)
{
    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            Polygon.rotate(State.tesserae[i].vertices, centroid, angle);
        }
    }
}

/**
 * =============================================================================
 *                              CUTTING
 * =============================================================================
 */

/**
 * Cut any tiles which the cut line crosses
 * @param {array} lineStart Start point of cut line
 * @param {array} lineEnd End point of cut line
 */
function tools_cut(lineStart, lineEnd)
{
    var parts, newTile;
    var undoCommand = new Array();
    var newTiles = new Array();

    for (var i = State.tesserae.length - 1; i >= 0; i--)
    {
        if (State.tesserae[i].image === null)
        {
            parts = Polygon.cut(State.tesserae[i].vertices, Polygon.sort(lineStart.concat(lineEnd)));

            if (parts !== null && parts.length > 1)
            {
                for (var k = 0; k < parts.length; k++)
                {
                    newTile = new Tessera(parts[k], State.tesserae[i].colour);
                    newTile.homeVertices = newTile.vertices.slice();
                    newTiles.push(newTile);
                }
                /* remove the tile which was cut */
                undoCommand.push([UndoRedo.DELETE, [State.tesserae[i]]]);
                State.tesserae.splice(i, 1);
            }
        }
    }

    /* add the new tiles to Tesserae */
    for (var i = 0; i < newTiles.length; i++)
    {
        State.tesserae.push(newTiles[i]);
        undoCommand.push([UndoRedo.ADD, [newTiles[i]]]);
    }

    pushToUndoStack(undoCommand);
}

/**
 * =============================================================================
 *                               MIRRORING
 * =============================================================================
 */

/**
 * flip selected tiles horizontally
 */
function mirrorHorizontal()
{
    tools_mirror(0);
}

/**
 * flip selected tiles vertically
 */
function mirrorVertical()
{
    tools_mirror(1);
}

/**
 * Flip selected tiles on the given axis
 * @param {number} axis 0: horizontal, 1: vertical
 */
function tools_mirror(axis)
{
    var undoCommand = new Array();
    var bb = calculateBoundingBoxForSelected();
    if (bb !== null)
    {
        var centroid = Polygon.calculateCentroid(bb);

        for (var i = 0; i < State.tesserae.length; i++)
        {
            if (State.tesserae[i].isSelected)
            {
                Polygon.mirror(State.tesserae[i].vertices, axis, centroid[axis]);
                undoCommand.push([UndoRedo.FLIP, [State.tesserae[i], State.tesserae[i].homeVertices.slice(), State.tesserae[i].vertices.slice()]]);
                State.tesserae[i].flip();
            }
        }

        pushToUndoStack(undoCommand);
    }
}

/**
 * =============================================================================
 *                               SELECTING
 * =============================================================================
 */

/**
 * Select tiles within the select box
 * @param {array} startPoint Start point of select box
 * @param {array} endPoint End point of select box
 */
function tools_select(startPoint, endPoint)
{
    var selectedArea = [
        startPoint[0], startPoint[1],
        endPoint[0], startPoint[1],
        endPoint[0], endPoint[1],
        startPoint[0], endPoint[1]
    ];

    for (var i = 0; i < State.tesserae.length; i++)
    {
        State.tesserae[i].isSelected = tileWithinSelection(State.tesserae[i].vertices, selectedArea);
    }
}

/**
 * Return true if vertices are within selectedArea
 * @param {array} vertices tile Vertices
 * @param {array} selectedArea Area to check
 * @returns {boolean}
 */
function tileWithinSelection(vertices, selectedArea)
{
    var selectedVertexCount = 0;

    for (var k = 0; k < vertices.length - 1; k += 2)
    {
        if (Polygon.containsPoint(selectedArea, [vertices[k], vertices[k + 1]]))
        {
            selectedVertexCount++;
        }
    }

    return selectedVertexCount >= (vertices.length / 4); /* half or more vertices enclosed */
}

/**
 * =============================================================================
 *                                DELETING
 * =============================================================================
 */

/**
 * Remove selected tiles from Tesserae
 */
function deleteTiles()
{
    var count = 0;
    var undoCommand = new Array();

    for (var i = State.tesserae.length - 1; i >= 0; i--)
    {
        if (State.tesserae[i].isSelected)
        {
            State.tesserae[i].isSelected = false;
            State.tesserae[i].vertices = State.tesserae[i].homeVertices.slice(); /* in case of undo delete */
            undoCommand.push([UndoRedo.DELETE, [State.tesserae[i]]]);
            State.tesserae.splice(i, 1);
            count++;
        }
    }

    pushToUndoStack(undoCommand);

    /* in case a new tile is dragged directly to the trash */
    if (count === 0)
    {
        count = 1;
    }

    setFeedback(count + (count === 1 ? Messages.TRASH_ONE : Messages.TRASH_MANY) + Messages.TRASHED);
}

/**
 * =============================================================================
 *                                CLIPBOARD
 * =============================================================================
 */

/**
 * Copy the selected tiles to the clipboard
 */
function copyToClipboard()
{
    var clones = new Array();
    var bb = calculateBoundingBoxForSelected();
    if (bb === null)
    {
        return null;
    }

    var shiftVector = Polygon.getShiftVector([0, 0], Polygon.calculateCentroid(bb));

    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            clones.push(State.tesserae[i].clone(shiftVector));
        }
    }

    if (clones.length > 0)
    {
        Clipboard.clipboard[Clipboard.TILES].push(clones);
        createClipboardButton();
        createDeleteButton(Clipboard.clipboard[Clipboard.BUTTONS], Clipboard.clipboard[Clipboard.DELETE]);
        createThumbnail(bb, clones);
    }

    /* put the originals back in place */
    resetVertices();

    setFeedback(Messages.COPIED);
}

/**
 * Create a button for the Clipboard
 */
function createClipboardButton()
{
    var x = Toolbar.toolbarButtons[Toolbar.CLIPBOARD_BUTTON].vertices[6],
            y = Toolbar.toolbarButtons[Toolbar.CLIPBOARD_BUTTON].vertices[7] + ((Clipboard.clipboard[Clipboard.TILES].length - 1) * Settings.BUTTON_SIZE);
    var nt = new ToolbarButton([
        x, y,
        x + Settings.BUTTON_SIZE, y,
        x + Settings.BUTTON_SIZE, y + Settings.BUTTON_SIZE,
        x, y + Settings.BUTTON_SIZE
    ], true);
    Clipboard.clipboard[Clipboard.BUTTONS].push(nt);
}

/**
 * Create a thumbnail for the selected tiles
 * @param {array} bb Bounding box for the tiles
 * @param {array} tiles The selected tiles
 */
function createThumbnail(bb, tiles)
{
    var scale = (Settings.BUTTON_SIZE / 3 * 2) / Math.max(bb[2] - bb[0], bb[5] - bb[3]);
    var thumbs = new Array();

    for (var i = 0; i < tiles.length; i++)
    {
        if (tiles[i].image === null)
        {
            var verts = tiles[i].vertices.slice();
            Polygon.scale(verts, scale);
            thumbs.push([tiles[i].colour, verts]);
        } else
        {
            var verts = tiles[i].vertices.slice(0, 2);
            Polygon.scale(verts, scale);
            thumbs.push([
                tiles[i].image,
                verts,
                tiles[i].image.width * scale,
                tiles[i].image.height * scale,
                tiles[i].getAngle(),
                tiles[i].flipped
            ]);
        }
    }
    Clipboard.clipboard[Clipboard.THUMBNAILS].push(thumbs);
}

/**
 * Create a delete button
 * @param {array} buttonArray The Button array matched to the delete buttons
 * @param {array} deleteArray The array to add the new delete button to
 */
function createDeleteButton(buttonArray, deleteArray)
{
    /* use this to calculate where the delete button goes */
    var vertices = buttonArray[buttonArray.length - 1].vertices;
    var width = Settings.QUARTER_BUTTON_SIZE;
    var x = vertices[2] - width;
    var y = vertices[3];
    deleteArray.push(new ToolbarButton([
        x, y,
        x + width, y,
        x + width, y + width,
        x, y + width
    ], true));
}

/**
 * Create new tiles from the clipboard data
 * @param {number} index The clipboard index to copy
 * @param {array} mousePos Where to centre the new tiles
 */
function copyFromClipboard(index, mousePos)
{
    var group = Clipboard.clipboard[Clipboard.TILES][index];
    for (var i = 0; i < group.length; i++)
    {
        State.tesserae.push(group[i].clone(mousePos));
    }
    State.activeTile = new Tessera(mousePos);
    State.activeTile.groupSize = group.length;
}

/**
 * Remove clipboard/user image button from its array
 * @param {number} index The index of the target
 * @param {array} targetArray The array to delete from
 * @param {String} message Feednack message to use
 * @returns {Boolean} True if targetArray still contains items
 */
function deleteFromToolbar(index, targetArray, message)
{
    for (var i = 0; i < targetArray.length; i++)
    {
        targetArray[i].splice(index, 1);
    }

    moveButtonsUp(index, targetArray);
    setFeedback(message);

    return targetArray[0].length !== 0;
}

/**
 * Move the remaining clipboard/user image buttons up to fill the gap made by deletion
 * @param {number} index Index of the removed button
 * @param {array} targetArray
 */
function moveButtonsUp(index, targetArray)
{
    /* Clipboard.BUTTONS and Clipboard.DELETE are the same as ImageTiles.BUTTONS and ImageTiles.DELETE (0 and 1) */
    for (var i = index; i < targetArray[Clipboard.BUTTONS].length; i++)
    {
        Polygon.translate(targetArray[Clipboard.BUTTONS][i].vertices, [0, -Settings.BUTTON_SIZE]);
        Polygon.translate(targetArray[Clipboard.DELETE][i].vertices, [0, -Settings.BUTTON_SIZE]);
    }
}

/**
 * =============================================================================
 *                              BOUNDING BOX
 * =============================================================================
 */

/**
 * Calculate a bounding box for selected tiles
 * @returns {Array} 4 vertices
 */
function calculateBoundingBoxForSelected()
{
    var firstSelected = getFirstSelectedTile();
    if (firstSelected === null)
    {
        return null;
    }

    var bounds = [firstSelected.vertices[1], firstSelected.vertices[0], firstSelected.vertices[1], firstSelected.vertices[0]];

    for (var i = 0; i < State.tesserae.length; i++)
    {
        if (State.tesserae[i].isSelected)
        {
            bounds = Polygon.calculateBounds(State.tesserae[i].vertices, bounds);
        }
    }

    return [bounds[3], bounds[0],
        bounds[1], bounds[0],
        bounds[1], bounds[2],
        bounds[3], bounds[2]];
}

/**
 * =============================================================================
 *                          LOADING USER IMAGES
 * =============================================================================
 */

/**
 * Attempt to load files from multipleFileInput
 * @param {type} files
 */
function tools_loadCustomImages(files)
{
    for (var i = 0; i < files.length; i++)
    {
        loadImage(files[i], function ()
        {
            var li = true;

            /* confirm loading of large image */
            if (this.width > Settings.CUSTOM_IMAGE_WARNING_SIZE ||
                    this.height > Settings.CUSTOM_IMAGE_WARNING_SIZE)
            {
                li = window.confirm(this.name + Messages.CUSTOM_IMAGE_WARNING);
            }
            if (li)
            {
                var userImageButton = new ToolbarButton(createButtonVertices(Toolbar.toolbarButtons[Toolbar.USER_IMAGES_BUTTON].vertices[0], Toolbar.toolbarButtons[Toolbar.USER_IMAGES_BUTTON].vertices[1] + (Settings.BUTTON_SIZE * (ImageTiles.buttons[ImageTiles.BUTTONS].length + 1))), true);
                userImageButton.setImage(this);
                userImageButton.calculateThumbDetails();
                ImageTiles.buttons[ImageTiles.BUTTONS].push(userImageButton);
                createDeleteButton(ImageTiles.buttons[ImageTiles.BUTTONS], ImageTiles.buttons[ImageTiles.DELETE]);
                redraw();
            }
        });
    }
}


/**
 * =============================================================================
 *                             FEEDBACK MESSAGE
 * =============================================================================
 */

/**
 * Set the feedback message
 * @param {type} message
 */
function setFeedback(message)
{
    /* clear old message */
    if (State.feedbackTimeout !== null)
    {
        clearTimeout(State.feedbackTimeout);
    }

    State.feedbackMessage = message;
    State.feedbackTimeout = setTimeout(function ()
    {
        State.feedbackMessage = null;
        State.feedbackTimeout = null;
        redraw();
    }, 2000);

    redraw();
}

/**
 * =============================================================================
 *                                  SAVE
 * =============================================================================
 */

/**
 * Save the project to file
 */
function save()
{
    var imgs = new Array();
    var tls = saveTiles(imgs);

    writeFile(JSON.stringify(
            {
                version: Settings.version,
                bg: saveBackground(),
                tiles: tls,
                images: imgs
            }));

    State.saved = true;
}

/**
 * Return an object literal with base64 image, width, and height
 * @returns {Object} object literal with base64 image, width, and height
 */
function saveBackground()
{
    var image = FileMenu.bgImage === null ? null : FileMenu.bgImage.src;
    var width = ctx.canvas.width;
    var height = ctx.canvas.height;

    return {image, width, height};
}

/**
 * Return an array of object literals
 * Each one contains {vertices, colour, flipped, imageIndex}
 * imageIndex refers to the base64Images array
 * @param {type} base64Images An array to store any tile images in base64
 * @returns {Array|saveTiles.tiles}
 */
function saveTiles(base64Images)
{
    var tiles = new Array();
    var vertices, colour, flipped, imageIndex = -1;
    var images = new Array();

    for (var i = 0; i < State.tesserae.length; i++)
    {
        vertices = State.tesserae[i].vertices;
        colour = State.tesserae[i].colour;
        flipped = State.tesserae[i].flipped;
        if (State.tesserae[i].image !== null)
        {
            var index = images.indexOf(State.tesserae[i].image);
            if (index > -1)
            {
                imageIndex = index;
            } else
            {
                images.push(State.tesserae[i].image);
                base64Images.push(State.tesserae[i].image.src);
                imageIndex = images.length - 1;
            }
        }
        tiles.push({vertices, colour, flipped, imageIndex});
    }

    return tiles;
}

/**
 * Open a Save dialog, and write the given string to file
 * 
 * https://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/
 * @param {String} saveString
 */
function writeFile(saveString)
{
    var blob = new Blob([saveString], {type: 'text/plain'});
    var url = window.URL.createObjectURL(blob);
    var dlLink = document.createElement('a');
    dlLink.download = Settings.DEFAULT_SAVE_FILENAME;
    dlLink.href = url;
    dlLink.onclick = function (event) {
        document.body.removeChild(event.target);
    };
    dlLink.style.display = 'none';
    document.body.append(dlLink);
    dlLink.click();
}

/**
 * =============================================================================
 *                                  LOAD
 * =============================================================================
 */

/**
 * Open the singleFileInput dialog
 * @param {type} mode Set State.mode for 0: save file, or 1: image
 */
function open(mode)
{
    State.openMode = mode;
    singleFileInput.click();
}

/**
 * load the given save file
 * @param {file} file
 */
function load(file)
{
    /* check the extension */
    if (file.name.indexOf(Settings.SAVEFILE_EXTENSION) === file.name.length - Settings.SAVEFILE_EXTENSION.length)
    {
        /* load save file if user confirms loss of current data */
        if (reset())
        {
            var reader = new FileReader();
            reader.onload = function (evt)
            {
                loadData(evt.target.result);
                singleFileInput.value = null;
                setFeedback(file.name + Messages.LOADED);
                redraw();
            };
            reader.readAsText(file, 'UTF-8');
        }
    }
    /* incorrect extension */
    else
    {
        setFeedback(Messages.WRONG_EXTENSION_WARNING);
    }
}

/**
 * parse the string and load the data
 * @param {String} saveString
 */
function loadData(saveString)
{
    var loadData = JSON.parse(saveString);

    loadBackground(loadData.bg);
    loadTiles(loadData.tiles, loadData.images);
}

/**
 * Load the background data
 * @param {type} bg
 */
function loadBackground(bg)
{
    /* image found */
    if (bg.image !== null)
    {
        FileMenu.bgImage = new Image();
        FileMenu.bgImage.src = bg.image;
        $canvasDiv.resizable('destroy');
        $canvasDiv.resizable({aspectRatio: true});
        State.bgImageVisible = true;
    }
    /* plain background */
    else
    {
        $canvasDiv.resizable('destroy');
        $canvasDiv.resizable();
    }

    ctx.canvas.width = bg.width;
    ctx.canvas.height = bg.height;

    $canvasDiv.width(bg.width);
    $canvasDiv.height(bg.height);
}

/**
 * populate Tesserae with the loaded tiles
 * @param {array} tiles loaded Tile data
 * @param {array} base64Images loaded image data
 */
function loadTiles(tiles, base64Images)
{
    var images = new Array();

    for (var i = 0; i < tiles.length; i++)
    {
        var tile = new Tessera(tiles[i].vertices, tiles[i].colour);
        tile.homeVertices = tile.vertices.slice();
        tile.flipped = tiles[i].flipped;

        if (tiles[i].imageIndex > -1)
        {
            var image = images[tiles[i].imageIndex];
            if (image === undefined)
            {
                image = new Image();
                image.src = base64Images[tiles[i].imageIndex];
                images[tiles[i].imageIndex] = image;
            }
            tile.setImage(image);
        }

        tile.isSelected = false;
        State.tesserae.push(tile);
    }
}

/**
 * =============================================================================
 *                                  DRAW
 * =============================================================================
 */

/**
 * Draw the canvas
 * @param {boolean} toolbar
 */
function redraw(toolbar = true)
{
    clearCanvas(ctx);
    drawBackgroundImage(ctx);
    drawTiles(ctx);
    drawCustomShape(ctx);
    drawToolbar(ctx, toolbar);
    drawActiveTile(ctx);
    drawDragline(ctx);
    drawFeedback(ctx);
}

/**
 * Clear the canvas with a blank background
 * @param {type} ctx
 */
function clearCanvas(ctx)
{
    ctx.fillStyle = getBackgroundColour();
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * draw the background image if set
 * @param {type} ctx
 */
function drawBackgroundImage(ctx)
{
    if (FileMenu.bgImage !== null && State.bgImageVisible)
    {
        ctx.drawImage(FileMenu.bgImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

/**
 * draw the tesserae
 * @param {type} ctx
 */
function drawTiles(ctx)
{
    if (State.tesserae !== null)
    {
        setSelectedDrawOptions(ctx);
        /* draw non-selected tiles */
        for (var i = 0; i < State.tesserae.length; i++)
        {
            if (!State.tesserae[i].isSelected)
            {
                State.tesserae[i].draw(ctx);
            }
        }

        /* draw selected tiles */
        for (var i = 0; i < State.tesserae.length; i++)
        {
            if (State.tesserae[i].isSelected)
            {
                State.tesserae[i].draw(ctx);
            }
        }
    }
}

/**
 * draw the activeTile
 * @param {type} ctx
 */
function drawActiveTile(ctx)
{
    if (State.activeTile instanceof Tessera)
    {
        setSelectedDrawOptions(ctx);
        State.activeTile.draw(ctx);
    }
}

/**
 * draw the cutline/select box
 * @param {type} ctx
 */
function drawDragline(ctx)
{
    if (State.dragStartPoint !== null)
    {
        if (State.ctrlDown)
        {
            drawSelectionBox(ctx, State.dragStartPoint, State.oldMousePos);
        } else
        {
            drawCutline(ctx, State.dragStartPoint, State.oldMousePos);
        }
    }
}

/**
 * drawt the cut line
 * @param {type} ctx
 * @param {type} startPoint Start of line
 * @param {type} endPoint End of line
 */
function drawCutline(ctx, startPoint, endPoint)
{
    setCutLineDrawOptions(ctx);

    ctx.beginPath();
    ctx.moveTo(startPoint[0], startPoint[1]);
    ctx.lineTo(endPoint[0], endPoint[1]);
    ctx.stroke();
}

/**
 * draw the select box
 * @param {type} ctx
 * @param {type} startPoint
 * @param {type} endPoint
 */
function drawSelectionBox(ctx, startPoint, endPoint)
{
    setSelectionBoxDrawOptions(ctx);

    ctx.beginPath();
    ctx.rect(startPoint[0], startPoint[1], endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
    ctx.stroke();
}

/**
 * draw the toolbar
 * @param {type} ctx
 * @param {type} draw Whether to draw the toolbar; false when saving as image
 */
function drawToolbar(ctx, draw)
{
    if (draw)
    {
        setToolbarDrawOptions(ctx);

        /* draw the handle first */
        drawRoundedRectangle(ctx, Toolbar.toolbarButtons[Toolbar.HANDLE_BUTTON].vertices, Settings.TOOLBAR_BG_COLOUR, 5);

        /* draw the white inner background */
        drawRoundedRectangle(ctx,
                Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices.slice(0, 2)
                .concat(Toolbar.toolbarButtons[Toolbar.HELP_BUTTON].vertices.slice(2, 6))
                .concat(Toolbar.toolbarButtons[Toolbar.SIZE_BUTTON].vertices.slice(6, 8)),
                Settings.TOOLBAR_INNER_COLOUR, 3);

        fillUndoRedoButtons(ctx);

        for (var i = 0; i < Toolbar.toolbarButtons.length - 1; i++)
        {
            Toolbar.toolbarButtons[i].draw(ctx);
        }

        drawSizeTriangle(ctx);

        if (State.regularShapesVisible)
        {
            drawRegularShapesButtons(ctx);
        }
        if (State.clipboardVisible)
        {
            drawClipboard(ctx);
        }
        if (State.customImagesVisible)
        {
            drawUserImageButtons(ctx);
        }
        if (State.filemenuVisible)
        {
            drawFileMenu(ctx);
        }
    }
}

/**
 * grey out undo/redo if the stacks are empty
 * @param {type} ctx
 */
function fillUndoRedoButtons(ctx)
{
    if (UndoRedo.undoStack.length === 0)
    {
        ctx.fillStyle = Settings.GREYED_OUT;
        ctx.fillRect(Toolbar.toolbarButtons[Toolbar.UNDO_BUTTON].vertices[0],
                Toolbar.toolbarButtons[Toolbar.UNDO_BUTTON].vertices[1],
                Settings.BUTTON_SIZE,
                Settings.BUTTON_SIZE);
    }

    if (UndoRedo.redoStack.length === 0)
    {
        ctx.fillStyle = Settings.GREYED_OUT;
        ctx.fillRect(Toolbar.toolbarButtons[Toolbar.REDO_BUTTON].vertices[0],
                Toolbar.toolbarButtons[Toolbar.REDO_BUTTON].vertices[1],
                Settings.BUTTON_SIZE,
                Settings.BUTTON_SIZE);
    }
}

/**
 * draw a rounded rectangle
 * @param {type} ctx
 * @param {array} vertices vertices to draw
 * @param {String} colour Colour of the rectangle
 * @param {number} cornerRadius Corner radius
 */
function drawRoundedRectangle(ctx, vertices, colour, cornerRadius = 6)
{
    ctx.beginPath();
    ctx.moveTo(vertices[0] + cornerRadius, vertices[1]);
    ctx.arcTo(vertices[2], vertices[3], vertices[2], vertices[3] + cornerRadius, cornerRadius);
    ctx.arcTo(vertices[4], vertices[5], vertices[4] - cornerRadius, vertices[5], cornerRadius);
    ctx.arcTo(vertices[6], vertices[7], vertices[6], vertices[7] - cornerRadius, cornerRadius);
    ctx.arcTo(vertices[0], vertices[1], vertices[0] + cornerRadius, vertices[1], cornerRadius);

    ctx.fillStyle = colour;
    ctx.fill();
}

/**
 * draw the size triangle
 * @param {type} ctx
 */
function drawSizeTriangle(ctx)
{
    var lScale = State.scale / Settings.SCALE_MAX;

    ctx.beginPath();
    ctx.moveTo(State.sizeTriangle[0], State.sizeTriangle[1]);
    ctx.lineTo(State.sizeTriangle[0] + (State.sizeTriangle[2] * lScale), State.sizeTriangle[1] + (State.sizeTriangle[3] * lScale));
    ctx.lineTo(State.sizeTriangle[0] + (State.sizeTriangle[4] * lScale), State.sizeTriangle[1] + (State.sizeTriangle[5] * lScale));
    ctx.closePath();
    ctx.fillStyle = getNewTileColour();
    ctx.fill();
}

/**
 * draw the regular shapes buttons
 * @param {type} ctx
 */
function drawRegularShapesButtons(ctx)
{
    var colour = getNewTileColour();
    for (var i = 0; i < RegularShapes.regularShapesButtons.length; i++)
    {
        RegularShapes.regularShapesButtons[i].draw(ctx); /* draw the button */
        drawRegularShapeThumbnail(RegularShapes.regularShapesThumbnails[i], colour); /* draw the shape */
    }
}

/**
 * draw user image buttons
 * @param {type} ctx
 */
function drawUserImageButtons(ctx)
{
    for (var i = 0; i < ImageTiles.buttons[ImageTiles.BUTTONS].length; i++)
    {
        ImageTiles.buttons[ImageTiles.BUTTONS][i].draw(ctx); /* draw the button */
        ImageTiles.buttons[ImageTiles.DELETE][i].draw(ctx);  /* draw delete button */
        drawX(ImageTiles.buttons[ImageTiles.DELETE][i].vertices); /* draw X on delete button */
    }
}

/**
 * draw the file menu
 * @param {type} ctx
 */
function drawFileMenu(ctx)
{
    for (var i = 1; i < FileMenu.buttons.length; i++)
    {
        FileMenu.buttons[i].draw(ctx);
    }

    if (FileMenu.bgImage !== null) /* add the checkbox if a background image is loaded */
    {
        FileMenu.buttons[FileMenu.CHECKBOX].setImage(State.bgImageVisible ? FileMenu.checkedImage : FileMenu.uncheckedImage);
        FileMenu.buttons[FileMenu.CHECKBOX].draw(ctx);
    }
}

/**
 * draw thumbnail for regular shape
 * @param {type} vertices
 * @param {type} colour
 */
function drawRegularShapeThumbnail(vertices, colour)
{
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(vertices[0], vertices[1]);
    for (var k = 2; k < vertices.length - 1; k += 2)
    {
        ctx.lineTo(vertices[k], vertices[k + 1]);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * draw the clipboard buttons
 * @param {type} ctx
 */
function drawClipboard(ctx)
{
    for (var i = 0; i < Clipboard.clipboard[Clipboard.BUTTONS].length; i++)
    {
        Clipboard.clipboard[Clipboard.BUTTONS][i].draw(ctx);
        drawClipboardThumbnail(ctx, Clipboard.clipboard[Clipboard.THUMBNAILS][i], Clipboard.clipboard[Clipboard.BUTTONS][i].vertices.slice(0, 2));
        Clipboard.clipboard[Clipboard.DELETE][i].draw(ctx);
        drawX(Clipboard.clipboard[Clipboard.DELETE][i].vertices);
    }
}

/**
 * draw an X across the given vertices (used on delete buttons)
 * @param {type} vertices
 */
function drawX(vertices)
{
    ctx.strokeStyle = Settings.TOOLBARBUTTON_OUTLINE_COLOUR;
    ctx.beginPath();
    ctx.moveTo(vertices[0], vertices[1]);
    ctx.lineTo(vertices[4], vertices[5]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vertices[2], vertices[3]);
    ctx.lineTo(vertices[6], vertices[7]);
    ctx.stroke();
}

/**
 * draw a clipbaord thumbnail
 * @param {type} ctx
 * @param {type} thumb
 * @param {type} offset
 */
function drawClipboardThumbnail(ctx, thumb, offset)
{
    offset[0] += Settings.HALF_BUTTON_SIZE;
    offset[1] += Settings.HALF_BUTTON_SIZE;

    for (var i = 0; i < thumb.length; i++)
    {
        if (thumb[i][0] instanceof Image)
        {
            drawThumbnailImage(ctx, thumb[i], offset);
        } else
        {
            drawThumbnailTile(ctx, thumb[i], offset);
        }
    }
}

/**
 * draw an image in clipboard thumbnail
 * @param {type} ctx
 * @param {type} thumb
 * @param {type} offset
 */
function drawThumbnailImage(ctx, thumb, offset)
{
    ctx.translate(thumb[1][0] + offset[0], thumb[1][1] + offset[1]);
    ctx.rotate(thumb[4]);
    if (thumb[5])
    {
        ctx.scale(-1, 1);
    }

    ctx.drawImage(thumb[0], 0, 0, thumb[2], thumb[3]);

    if (thumb[5])
    {
        ctx.scale(-1, 1);
    }
    ctx.rotate(-thumb[4]);
    ctx.translate(-(thumb[1][0] + offset[0]), -(thumb[1][1] + offset[1]));
}

/**
 * draw a plain tile in clipboard thumbnail
 * @param {type} ctx
 * @param {type} thumb
 * @param {type} offset
 */
function drawThumbnailTile(ctx, thumb, offset)
{
    ctx.fillStyle = thumb[0];
    ctx.beginPath();
    ctx.moveTo(thumb[1][0] + offset[0], thumb[1][1] + offset[1]);
    for (var k = 2; k < thumb[1].length - 1; k += 2)
    {
        ctx.lineTo(thumb[1][k] + offset[0], thumb[1][k + 1] + offset[1]);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * draw the edges of a custom shape in progress
 * @param {type} ctx
 */
function drawCustomShape(ctx)
{
    if (State.customShapeVertices !== null)
    {
        var vertices = State.customShapeVertices;
        ctx.setLineDash([]);
        ctx.fillStyle = getNewTileColour();

        if (vertices !== null && vertices.length > 0)
        {
            ctx.beginPath();
            ctx.moveTo(vertices[0], vertices[1]);

            if (vertices.length > 2)
            {
                for (var i = 2; i < vertices.length; i += 2)
                {
                    ctx.lineTo(vertices[i], vertices[i + 1]);
                }
            }

            ctx.lineTo(State.oldMousePos[0], State.oldMousePos[1]);
            ctx.stroke();

            drawCircle(vertices[0], vertices[1], Settings.CUSTOM_SHAPE_HOME_SIZE, Settings.CUSTOM_SHAPE_CIRCLE_COLOUR);
        }
    }
}

/**
 * draw a circle
 * @param {type} x
 * @param {type} y
 * @param {type} radius
 * @param {type} colour
 */
function drawCircle(x, y, radius, colour)
{
    ctx.setLineDash([]);
    ctx.fillStyle = colour;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
}

/**
 * draw the feedback message
 * @param {type} ctx
 */
function drawFeedback(ctx)
{
    if (State.feedbackMessage !== null)
    {
        setFeedbackDrawOption(ctx);

        var width = ctx.measureText(State.feedbackMessage).width + 10;
        var x = (ctx.canvas.width / 2) - (width / 2);
        var y = (ctx.canvas.height / 2) - 15;
        var feedbackHeight = 20;

        drawRoundedRectangle(ctx, [x, y, x + width, y, x + width, y + feedbackHeight, x, y + feedbackHeight], Settings.FEEDBACK_BACKGROUND_COLOUR, 4);
        ctx.fillStyle = Settings.FEEDBACK_TEXT_COLOUR;
        ctx.fillText(State.feedbackMessage,
                ctx.canvas.width / 2,
                ctx.canvas.height / 2);
    }
}

/**
 * context settings for cutline
 * @param {type} ctx
 */
function setCutLineDrawOptions(ctx)
{
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = Settings.SELECTED_OUTLINE_COLOUR;
}

/**
 * context settings for select box
 * @param {type} ctx
 */
function setSelectionBoxDrawOptions(ctx)
{
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = Settings.SELECTED_OUTLINE_COLOUR;
}

/**
 * context settings for feedback
 * @param {type} ctx
 */
function setFeedbackDrawOption(ctx)
{
    ctx.font = Settings.FONT;
    ctx.textAlign = 'center';
}

/**
 * context settings for selected tiles
 * @param {type} ctx
 */
function setSelectedDrawOptions(ctx)
{
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = Settings.SELECTED_OUTLINE_COLOUR;
}

/**
 * context settings for toolbar
 * @param {type} ctx
 */
function setToolbarDrawOptions(ctx)
{
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = Settings.TOOLBARBUTTON_OUTLINE_COLOUR;
}

/**
 * =============================================================================
 *                                POLYGON
 * =============================================================================
 */

var Polygon = {};

Polygon.PI_OVER_180 = Math.PI / 180;

/**
 * Return an array of polygons created when line cuts vertices
 * Array.length === 1 if polygon is not cut
 * @param {type} vertices
 * @param {type} line
 * @returns {Array|Polygon.cut.parts}
 */
Polygon.cut = function (vertices, line)
{
    var allPoints = new Array();
    var crossbackPairs = new Array();
    var parts = null;
    var currentIntersection;

    for (var i = 0; i < vertices.length; i += 2)
    {
        var v = vertices.slice(i, i + 2);
        allPoints.push([false, v]);
        v = v.concat([vertices[(i + 2) % vertices.length], vertices[(i + 3) % vertices.length]]);
        currentIntersection = Polygon.calculateIntersection(v, line);

        if (currentIntersection !== null)
        {
            allPoints.push([true, currentIntersection]);
            crossbackPairs.push(currentIntersection);
        }
    }

    if (crossbackPairs.length > 1)
    {
        crossbackPairs = Polygon.sort(crossbackPairs);
        parts = [new Array()];

        var currentPoint;
        var isIntersection;
        var currentPoly = 0;
        var pendingCrossbacks = new Array();

        for (var i = 0; i < allPoints.length; i++)
        {
            isIntersection = allPoints[i][0];
            currentPoint = allPoints[i][1];
            parts[currentPoly] = parts[currentPoly].concat(currentPoint);

            if (isIntersection)
            {
                pendingCrossbacks[currentPoly] = Polygon.findCrossbackPartner(currentPoint, crossbackPairs);
                var crossbackIndex = Polygon.findCrossbackIndex(currentPoint, pendingCrossbacks);

                if (crossbackIndex === -1)
                {
                    parts.push(currentPoint.slice()); /* new polygon */
                    currentPoly = parts.length - 1;
                } else
                {
                    currentPoly = crossbackIndex;
                    parts[currentPoly] = parts[currentPoly].concat(currentPoint);
                }
            }
        }
    }

    return parts;
};

/**
 * find the twin of the crossback pair
 * @param {type} point
 * @param {type} crossbackPairs
 * @returns {crossbackPairsPartner.intersections}
 */
Polygon.findCrossbackPartner = function (point, crossbackPairs)
{
    var partner = null;

    for (var i = 0; i < crossbackPairs.length; i++)
    {
        if (point[0] === crossbackPairs[i][0] &&
                point[1] === crossbackPairs[i][1])
        {
            if (i % 2 === 0)
            {
                partner = crossbackPairs[i + 1];
            } else
            {
                partner = crossbackPairs[i - 1];
            }
        }
    }
    return partner;
};

/**
 * return the index of the crossback intersection
 * @param {type} intersection
 * @param {type} crossbacks
 * @returns {Number}
 */
Polygon.findCrossbackIndex = function (intersection, crossbacks)
{
    var index = -1;
    for (var i = 0; i < crossbacks.length; i++)
    {
        if (crossbacks[i][0] === intersection[0] &&
                crossbacks[i][1] === intersection[1])
        {
            index = i;
            break;
        }
    }

    return index;
};

/**
 * find the angle in radians between the vectors formed from origin to point1 and origin point2
 * 
 * http://www.euclideanspace.com/maths/algebra/vectors/angleBetween/
 * http://www.euclideanspace.com/maths/algebra/vectors/angleBetween/issues/index.htm
 * 
 * @param {type} origin
 * @param {type} point1
 * @param {type} point2
 * @returns {Number}
 */
Polygon.calculateAngle = function (origin, point1, point2)
{
    var translatedV1 = [point1[0] - origin[0], point1[1] - origin[1]];
    var translatedV2 = [point2[0] - origin[0], point2[1] - origin[1]];
    return Math.atan2(translatedV2[1], translatedV2[0]) - Math.atan2(translatedV1[1], translatedV1[0]);
};

/**
 * sort the point by increasing y, then increasing x
 * @param {array} points
 * @returns {array}
 */
Polygon.sort = function (points)
{
    return Polygon.sortByAxis(Polygon.sortByAxis(points, 1), 0);
};

/**
 * sort the points by the given axis (0 = x, 1 = y)
 * @param {type} axis
 * @param {type} points
 * @returns {array}
 */
Polygon.sortByAxis = function (points, axis)
{
    var swap;
    var swapped = true;

    while (swapped)
    {
        swapped = false;
        for (var i = 0; i < points.length - 1; i++)
        {
            if (points[i][axis] > points[i + 1][axis])
            {
                swap = points[i + 1];
                points[i + 1] = points[i];
                points[i] = swap;
                swapped = true;
            }
        }
    }

    return points;
};

/**
 * translate the given vertices by shiftVector
 * @param {type} vertices
 * @param {type} shiftVector
 */
Polygon.translate = function (vertices, shiftVector)
{
    for (var i = 0; i < vertices.length - 1; i += 2)
    {
        vertices[i] += shiftVector[0];     // x
        vertices[i + 1] += shiftVector[1]; // y
    }
};

/**
 * Rotate the given vertices by angle around centre
 * @param {type} vertices
 * @param {type} centre
 * @param {type} angle
 */
Polygon.rotate = function (vertices, centre, angle)
{
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var oldX;

    for (var i = 0; i < vertices.length; i += 2)
    {
        oldX = vertices[i];
        vertices[i] = (cos * (vertices[i] - centre[0])) + (sin * (vertices[i + 1] - centre[1])) + centre[0];
        vertices[i + 1] = (cos * (vertices[i + 1] - centre[1])) - (sin * (oldX - centre[0])) + centre[1];
    }
};

/**
 * Scale the given vertices by scale
 * @param {type} vertices
 * @param {type} scale
 */
Polygon.scale = function (vertices, scale)
{
    for (var i = 0; i < vertices.length; i++)
    {
        vertices[i] *= scale;
    }
};

/**
 * Mirror the given vertices across axis and mirrorLine
 * @param {type} vertices
 * @param {type} axis 0: x axis, 1: y axis
 * @param {type} mirrorLine the coordinate to mirror across
 */
Polygon.mirror = function (vertices, axis, mirrorLine)
{
    for (var i = axis; i < vertices.length; i += 2)
    {
        vertices[i] += (mirrorLine - vertices[i]) * 2;
    }
};

/**
 * return the centroid of the given vertices
 * @param {type} vertices
 * @returns {Array}
 */
Polygon.calculateCentroid = function (vertices)
{
    var cx = 0, cy = 0, area = 0;
    var firstX, firstY, secondTerm, secondTerm1, secondTerm2;

    for (var i = 0; i < vertices.length - 1; i += 2)
    {
        firstX = vertices[i] + vertices[(i + 2) % vertices.length];
        firstY = vertices[i + 1] + vertices[(i + 3) % vertices.length];

        secondTerm1 = (vertices[i] * vertices[(i + 3) % vertices.length]);
        secondTerm2 = (vertices[(i + 2) % vertices.length] * vertices[i + 1]);
        secondTerm = secondTerm1 - secondTerm2;

        cx += (firstX * secondTerm);
        cy += (firstY * secondTerm);
        area += secondTerm1 - secondTerm2;
    }

    area /= 2;

    var multiplier = 1 / (6 * area);
    cx = cx * multiplier;
    cy = cy * multiplier;

    return [cx, cy];
};


/**
 * get the difference between two points
 * @param {type} point1
 * @param {type} point2
 * @returns {Array}
 */
Polygon.getShiftVector = function (point1, point2)
{
    return [point1[0] - point2[0],
        point1[1] - point2[1]];
};

/**
 * Return whether the given point is within the given vertices
 * @param {type} vertices
 * @param {type} point
 * @param {type} outsidePoint This must be outside the tested vertices - default value should be sufficient for Mosaic
 * @returns {Boolean}
 */
Polygon.containsPoint = function (vertices, point, outsidePoint = [ - 99999, - 99999])
{
    var pointWithin = false;

    if (Polygon.isPointWithinBounds(vertices, point))
    {
        var intersectionCount = 0;
        var line = outsidePoint.concat(point);
        for (var i = 0; i < vertices.length - 1; i += 2)
        {

            if (Polygon.edgesIntersect(
                    [vertices[i], vertices[i + 1], vertices[(i + 2) % vertices.length], vertices[(i + 3) % vertices.length]],
                    line))
            {
                intersectionCount++;
            }
        }

        pointWithin = (intersectionCount % 2) === 1;
    }
    return pointWithin;
};

/**
 * Return whether the given point falls within the bounding box of the given vertices
 * @param {type} vertices
 * @param {type} point
 * @returns {Boolean}
 */
Polygon.isPointWithinBounds = function (vertices, point)
{
    var bb = Polygon.calculateBounds(vertices, [vertices[1], vertices[0], vertices[1], vertices[0]]);

    return (point[1] > bb[0] &&
            point[1] < bb[2] &&
            point[0] > bb[3] &&
            point[0] < bb[1]);
};

/**
 * Calculate the bounds of the given vertices
 * @param {type} vertices
 * @param {type} bounds
 * @returns {Array}
 */
Polygon.calculateBounds = function (vertices, bounds)
{
    var top = bounds[0];
    var right = bounds[1];
    var bottom = bounds[2];
    var left = bounds[3];

    for (var k = 0; k < vertices.length; k += 2)
    {
        var lineX = vertices[k];
        if (lineX < left)
        {
            left = lineX;
        } else if (lineX > right)
        {
            right = lineX;
        }

        var lineY = vertices[k + 1];
        if (lineY < top)
        {
            top = lineY;
        } else if (lineY > bottom)
        {
            bottom = lineY;
        }
    }

    return [top, right, bottom, left];
};

/**
 * Return whether v1 is equal to v2
 * @param {type} v1
 * @param {type} v2
 * @returns {Boolean}
 */
Polygon.equals = function (v1, v2)
{
    var equal = v1.length === v2.length;

    if (equal)
    {
        for (var i = 0; i < v1.length; i++)
        {
            equal = v1[i] === v2[i];
            if (!equal)
            {
                break;
            }
        }
    }

    return equal;
};

/**
 * return true if given vertices form a simple polygon
 * @param {type} vertices
 * @returns {Boolean}
 */
Polygon.isSimple = function (vertices)
{
    return Polygon.isSimpleEdges(Polygon.getEdges(vertices));
};

/**
 * Return true if the given edges form a simple polygon
 * @param {type} edges
 * @returns {Boolean}
 */
Polygon.isSimpleEdges = function (edges)
{
    var simple = true;

    for (var i = 0; i < edges.length; i++)
    {
        for (var k = i + 1; k < edges.length; k++)
        {
            if (Polygon.edgesIntersect(edges[i], edges[k]))
            {
                simple = false;
                break;
            }
        }
    }

    return simple;
};

/**
 * Return true if edges a and b intersect
 * http://algs4.cs.princeton.edu/91primitives/
 * @param {type} a
 * @param {type} b
 * @returns {Boolean}
 */
Polygon.edgesIntersect = function (a, b)
{
    return Polygon.ccw(a.slice(0, 2), a.slice(2, 4), b.slice(0, 2))
            * Polygon.ccw(a.slice(0, 2), a.slice(2, 4), b.slice(2, 4)) < 0
            &&
            Polygon.ccw(b.slice(0, 2), b.slice(2, 4), a.slice(0, 2))
            * Polygon.ccw(b.slice(0, 2), b.slice(2, 4), a.slice(2, 4)) < 0;
};

/**
 * Return a number indicating convexity of the angle
 * positive number: concave angle
 * negative number: reflex angle
 * zero: collinear
 * @param {type} a
 * @param {type} b
 * @param {type} c
 * @returns {Number}
 */
Polygon.ccw = function (a, b, c)
{
    // (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
    return ((b[0] - a[0]) * (c[1] - a[1])) - ((c[0] - a[0]) * (b[1] - a[1]));
};

/**
 * Calculate the point of intersection between line1 and line2; null if no intersection
 * @param {type} line1
 * @param {type} line2
 * @returns {Array}
 */
Polygon.calculateIntersection = function (line1, line2)
{
    var intersection = null;

    var diff1 = Polygon.getShiftVector(line1.slice(0, 2), line1.slice(2, 4));
    var diff2 = Polygon.getShiftVector(line2.slice(0, 2), line2.slice(2, 4));
    var scalar1 = Polygon.getScalar(line1.slice(0, 2), line2.slice(0, 2), diff1, diff2);
    var scalar2 = Polygon.getScalar(line2.slice(0, 2), line1.slice(0, 2), diff2, diff1);

    if (Polygon.isBetweenZeroAndOne(scalar1) &&
            Polygon.isBetweenZeroAndOne(scalar2) &&
            Polygon.crossMultiply2D(diff1, diff2) !== 0)
    {
        intersection = [line1[0] - (diff1[0] * scalar1), line1[1] - (diff1[1] * scalar1)];
    }

    return intersection;
};

/**
 * is n between 0 and 1 inclusive
 * @param {type} n
 * @returns {Boolean}
 */
Polygon.isBetweenZeroAndOne = function (n)
{
    return n > 0 && n < 1;
};

/**
 * get the scalar value for vector 1 at the point it intersects vector 2
 * @param {type} start1
 * @param {type} start2
 * @param {type} diff1
 * @param {type} diff2
 * @returns {Number}
 */
Polygon.getScalar = function (start1, start2, diff1, diff2)
{
    // t = s * (q - p) / (r * s)
    // scalar = diff2 * (start2 - start1) / (diff1 * diff2)

    return Polygon.crossMultiply2D(diff2, Polygon.getShiftVector(start2, start1)) / Polygon.crossMultiply2D(diff1, diff2);
};

/**
 * return the vector cross product (a single number) of the two points
 * cross product: V × W = (VxWy) − (VyWx)
 * @param {type} point1
 * @param {type} point2
 * @returns {Number}
 */
Polygon.crossMultiply2D = function (point1, point2)
{
    return (point1[0] * point2[1]) - (point1[1] * point2[0]);
};

Polygon.degreesToRadians = function (degrees)
{
    return (degrees / 1) * Polygon.PI_OVER_180;
};

Polygon.length = function (edge)
{
    return Math.sqrt(Math.pow(edge[0] - edge[2], 2) + Math.pow(edge[1] - edge[3], 2));
};

Polygon.distance = function (p1, p2)
{
    return Polygon.length(p1.concat(p2));
};

/**
 * Return the given vertices expressed as a set of edges
 * @param {type} vertices
 * @returns {Array|Polygon.getEdges.edges}
 */
Polygon.getEdges = function (vertices)
{
    var edges = new Array();

    for (var i = 0; i < vertices.length; i += 2)
    {
        edges.push([vertices[i], vertices[i + 1], vertices[(i + 2) % vertices.length], vertices[(i + 3) % vertices.length]]);
    }

    return edges;
};