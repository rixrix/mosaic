
document.addEventListener('drop', function(event) {
    event.preventDefault();
});

document.addEventListener('dragenter', function(event) {
    if (event.target.className == 'Container-dragDropImage') {
        event.target.style.border = '2px dotted red';
    }
});

document.addEventListener('dragover', function(event){
    event.preventDefault();
});

document.addEventListener('drop', function(event) {
    event.preventDefault();
    droppedImageHandler(event);
});

function droppedImageHandler(event) {
    var file = event.dataTransfer.files[0];
    var reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (function(event) {
        var image = new Image();

        image.src = event.target.result;
        image.onload = function(event) {
            generatePhotoMosaic(this);
        };
    });
}

function generatePhotoMosaic(rawImageData) {
    var tileWidth = TILE_WIDTH;     // global: TILE_WIDTH
    var tileHeight = TILE_HEIGHT;   // global: TILE_WIDTH

    var imageWidth = rawImageData.width;
    var imageHeight = rawImageData.height;

    var imageTiles = getImageTile(tileWidth, tileHeight, imageWidth, imageHeight, rawImageData);

    renderPhotoMosaicFromImageTiles(imageTiles);

    console.log('width:' + imageWidth, 'height:' + imageHeight);
    console.log('imageTiles', imageTiles);
}

function renderPhotoMosaicFromImageTiles(imagesTiles) {
    var photoMosaicContainer = document.querySelector('#photoMosaicContainer');

    imagesTiles.map(function(imageTile, imageTileIndex) {
        var imageRowContainer = document.createElement('div');

        imageTile.map(function(hexColor, hexIndex){
            var imageRowContent = document.createElement('img');
            imageRowContent.src = "/color/" + hexColor;
            imageRowContent.setAttribute('class', imageTileIndex + '-' + hexIndex);
            imageRowContainer.appendChild(imageRowContent);
        });

        photoMosaicContainer.appendChild(imageRowContainer);
    });

    console.log('photoMosaicContainer', photoMosaicContainer);
}

/**
 * Returns an image tile in 2-dimensional format
 *
 *              C O L U M N S
 *           -------------------------------
 *      R   | [HEX] | [HEX] | [HEX] | [HEX] |
 *          |-------------------------------|
 *      O   | [HEX] | [HEX] | [HEX] | [HEX] |
 *          |-------------------------------|
 *      W   | [HEX] | [HEX] | [HEX] | [HEX] |
 *          |-------------------------------|
 *      S   | [HEX] | [HEX] | [HEX] | [HEX] |
 *          |-------------------------------|
 *          | [HEX] | [HEX] | [HEX] | [HEX] |
 *          |-------------------------------|
 *          | [HEX] | [HEX] | [HEX] | [HEX] |
 *           -------------------------------
 */
function getImageTile(tileWidth, tileHeight, imageWidth, imageHeight, rawImageData) {
    var rowSize = Math.floor(imageWidth / tileWidth);
    var columnSize = Math.floor(imageHeight / tileHeight);

    var arrayOfImageData = getImageDataFromRenderedCanvas(imageWidth, imageHeight, rawImageData);

    var imageTile = [];

    for (var row = 0; row < rowSize; row++) {
        imageTile[row] = [];
        // console.log('row:', row);
        for (var column = 0; column < columnSize; column++) {
            var x = column * tileWidth,
                y = row * tileHeight,
                r = 0,  // red
                g = 1,  // green
                b = 2;  // blue

            imageTile[row][column] = rgbToHex(arrayOfImageData[x + y + r], arrayOfImageData[x + y + g], arrayOfImageData[x + y + b]);
            // console.log('column:', column, rgbToHex(arrayOfImageData[x + y + r], arrayOfImageData[x + y + g], arrayOfImageData[x + y + b]));
        }
    }

    console.log('rowSize:' + rowSize, 'columnSize:' + columnSize);
    return imageTile;
}

/**
 * Returns an array(one-dimension) of RGBA image in Uint8ClampedArray format.
 * see: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
 *
 * @returns Uint8ClampedArray RGBA image
 */
function getImageDataFromRenderedCanvas(imageWidth, imageHeight, rawImageData) {
    var context;
    var arrayOfImageData;
    var canvas = document.createElement('canvas');

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    context = canvas.getContext('2d');

    // render onto the canvas
    context.drawImage(rawImageData, 0, 0, canvas.width, canvas.height);

    // get rendered image data from canvas
    arrayOfImageData = context.getImageData(0, 0, imageWidth, imageHeight);

    return arrayOfImageData.data;
}

/**
 * Connverts RGB to Hex format
 *  see: http://stackoverflow.com/a/5624139
 *
 */
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
