

PhotoMosaic = (function() {
    /**
     * global options
     * @type {object[]}
     */
    var options = {};

    /**
     * Generates the photo mosaic
     *
     * @param {object[]} sourceImage
     */
    function generatePhotoMosaic(sourceImage) {
        var imageWidth = sourceImage.width,
            imageHeight = sourceImage.height;

        var imageTiles = getImageTile(imageWidth, imageHeight, sourceImage);

        renderPhotoMosaicFromImageTiles(imageWidth, imageHeight, imageTiles);
    }

    /**
     * Renders a photo mosaic image from the original uploaded image
     *
     * @param {number} imageWidth
     * @param {number} imageHeight
     * @param {object[]} imagesTiles
     */
    function renderPhotoMosaicFromImageTiles(imageWidth, imageHeight, imagesTiles) {
        var photoMosaicContainer = document.querySelector('#photoMosaicContainerId');

        photoMosaicContainer.setAttribute('style', 'width:' + imageWidth + 'px;height:100%');
        photoMosaicContainer.innerHTML = '';

        imagesTiles.map(function(imageTile, imageTileIndex) {
            var imageRowContainer = document.createElement('div');

            imageTile.map(function(hexColor, hexIndex) {
                var imageRowContent = document.createElement('img');
                imageRowContent.src = "/color/" + hexColor;
                imageRowContainer.appendChild(imageRowContent);
            });

            photoMosaicContainer.appendChild(imageRowContainer);
        });
    }

    /**
     * Returns an image tile in 2-dimensional array
     *
     * @param {number} imageWidth
     * @param {number} imageHeight
     * @param {object} sourceImage
     * @returns {object[]} imageTile
     */
    function getImageTile(imageWidth, imageHeight, sourceImage) {
        var rowSize = Math.floor(imageWidth / options.tileWidth),
            columnSize = Math.floor(imageHeight / options.tileHeight),
            arrayOfImageData = getImageDataFromRenderedCanvas(imageWidth, imageHeight, sourceImage);

        var imageTile = [],
            RGBCHUNKSINBYTES = 4;

        for (var column = 0; column < columnSize; column++) {

            // set 2-dimensional array
            imageTile[column] = [];

            for (var row = 0; row < rowSize; row++) {

                var y = column * options.tileHeight,
                    x = row * options.tileWidth,
                    r = 0,  // red array index
                    g = 1,  // green array index
                    b = 2;  // blue array index

                var offSetY = y * imageWidth * RGBCHUNKSINBYTES,
                    offSetX = x * RGBCHUNKSINBYTES;

                imageTile[column][row] = rgbToHex(
                    arrayOfImageData[offSetX + offSetY + r],
                    arrayOfImageData[offSetX + offSetY + g],
                    arrayOfImageData[offSetX + offSetY + b]
                );
            }
        }

        return imageTile;
    }

    /**
     * Returns an array(one-dimension) of RGBA image in Uint8ClampedArray format
     *
     * see: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
     *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
     *
     * @param {number} imageWidth
     * @param {number} imageHeight
     * @returns Uint8ClampedArray RGBA image
     */
    function getImageDataFromRenderedCanvas(imageWidth, imageHeight, sourceImage) {
        var context,
            arrayOfImageData,
            canvas = document.createElement('canvas');

        canvas.width = imageWidth;
        canvas.height = imageHeight;
        context = canvas.getContext('2d');

        // render onto the canvas
        context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

        // get rendered image data from canvas
        arrayOfImageData = context.getImageData(0, 0, imageWidth, imageHeight);

        return arrayOfImageData.data;
    }

    /**
     * Connverts RGB to Hex format
     *  see: http://stackoverflow.com/a/5624139
     *
     * @param {number} r = red
     * @param {number} g = green
     * @param {number} b = blue
     * @returns {string} Hex representation of RGB values
     */
    function rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Image drop event handler
     *
     * @param {object[]} Image metadata
     */
    function onImageDropEventHandler(event) {
        var file = event.dataTransfer.files[0];
        var reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = function(event) {
            var image = new Image();

            image.src = event.target.result;
            image.onload = function(event) {
                generatePhotoMosaic(this);
            };
        };
    }

    /**
     * Main Entry point
     */
    return {
        /**
         * Where options:
         *      options = {
         *          tileWidth: number
         *          tileHeight: number,
         *          photoMosaicContainerId: string,
         *          sourceImageContainerId: string,
         *      }
         */
        init: function(opt) {
            if (Object.keys(opt).length == 0) return;

            options = opt;
            var sourceImage = document.querySelector(options.sourceImageContainerId);

            sourceImage.addEventListener('drop', onImageDropEventHandler);
            this.preventDefaults();
        },

        /**
         * Prevents accidental page wipeout.
         * Drop events should only be handled within the image drop zone area
         */
        preventDefaults: function() {
            ['drop', 'dragover'].forEach(function(event) {
                document.addEventListener(event, function(e) { e.preventDefault() });
            });
        }
    };

}());