
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

/**
 *    -----------------------------
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    [rgb][rgb][rgb][rgb][rgb][rgb]
 *    -----------------------------
 *
 */

var imageWidth;
var imageHeight;


function droppedImageHandler(event) {
    var file = event.dataTransfer.files[0];
    var reader = new FileReader();
    // var imageContainer = document.querySelector('#renderedImageMosaicId'); // temp

    reader.readAsDataURL(file);
    reader.onload = (function(evt) {
        var image = new Image();

        // imageContainer.src = evt.target.result; // temp

        image.src = evt.target.result;
        image.onload = function(evt) {
            imageWidth = this.width;
            imageHeight = this.height;

            tileGen(imageWidth, imageHeight, this);
            console.log('widht:' + imageWidth, 'height:' + imageHeight);
        };
    });
}

function toCanvas(uploadedImageData) {
    var canvas = document.createElement('canvas');
    var context;

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    context = canvas.getContext('2d');
    context.drawImage(uploadedImageData, 0, 0, canvas.width, canvas.height);

    return context;
}

function getImagePixels(context, imageWidth, imageHeight) {
    var pixels = context.getImageData(0, 0, imageWidth, imageHeight);
    return pixels.data;
}

function tileGen(width, height, uploadedImageData) {
    var rowSize = Math.floor(width / 16);
    var colSize = Math.floor(height / 16);

    var context = toCanvas(uploadedImageData);
    var pixels = getImagePixels(context, imageWidth, imageHeight);

    var yPixel = 0;
    var imagePixels = [];

    var offset = 0;

    for (currentRowTile = 0; currentRowTile < rowSize; currentRowTile++) {
        yPixel = currentRowTile * TILE_HEIGHT;
        offset = yPixel * 4;

        imagePixels.push([]);

        for (currentColTile = 0; currentColTile < colSize; currentColTile++) {
            imagePixels[currentRowTile] = [0, 1, 2, 3].map(function(index) {
                var xxx = pixels[offset + index];
                return xxx;
            });
        }
    }

    var rgbDivContainter = document.querySelector('.Container-renderedImageMosaic');
    imagePixels.map(function(index){
        var img = document.createElement('img');

        img.src = 'color/' + rgbToHex(index[0], index[1], index[2]);
        rgbDivContainter.appendChild(img);
    });

    console.log('rowSize:' + rowSize, 'colSize:' + colSize);
    console.log("the pixels", imagePixels);
    // console.log('context', context.getImageData(5, 5, 1, 1).data);
    // console.log('pixels', pixels);
}

// http://stackoverflow.com/a/5624139
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
