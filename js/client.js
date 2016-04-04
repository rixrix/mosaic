"use strict";

var PhotoMosaic = (function() {
    /**
     * global options
     * @type {object[]}
     */
    var options = {};

    var errorMessages = {
        ERR_INVALID_TYPE: 'Invalid file type. Allowed file format: *.png, *.jpg, *.gif',
        ERR_FILE_UPLOAD: 'There was an error during file upload',
        ERR_IMAGE_LOAD: 'There was an error while loading image'
    };

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

        photoMosaicContainer.innerHTML = ''; // clear out mosaic container
        photoMosaicContainer.setAttribute('style', 'width:' + imageWidth + 'px;');

        imagesTiles.map(function(rowOfHexColourImages) {
            var imageRowContainer = document.createElement('div');
            var preLoadImageTilePromises = rowOfHexColourImages.map(function(colour) {
                return preLoadImageTile('/color/' + colour);
            });

            // render each rows of tile in parallel
            Promise.all(preLoadImageTilePromises)
            .then(function(imageUrls) {
                imageUrls.map(function(url) {
                    var imageElement = document.createElement('img');

                    imageElement.src = url;
                    imageRowContainer.appendChild(imageElement);
                });
            });

            photoMosaicContainer.appendChild(imageRowContainer);
        });
    }

    /**
     * Returns a promise while waiting for the image to load
     *
     * @param {string} image resource path
     * @returns {promise}
     */
    function preLoadImageTile(colourPath) {
        return new Promise(function(resolve, reject) {
            var imageTile = new Image();

            imageTile.src = colourPath;
            imageTile.onload = function() {
                resolve(colourPath);
            };

            // At some stage when the server gets choked eg. large image
            // We still would want to continue processing the rest of the promises
            imageTile.onerror = resolve;
        });
    }

    /**
     * Returns an image tile in 2-dimensional array. It will computes the average colour for each tile
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
            RGB_CHUNKS_IN_BYTES = 4;

        for (var column = 0; column < columnSize; column++) {

            // set 2-dimensional array
            imageTile[column] = [];

            for (var row = 0; row < rowSize; row++) {

                var y = column * options.tileHeight,
                    x = row * options.tileWidth,
                    redIdx = 0,   // red array index
                    greenIdx = 1, // green array index
                    blueIdx = 2;  // blue array index

                var offSetY = y * imageWidth * RGB_CHUNKS_IN_BYTES,
                    offSetX = x * RGB_CHUNKS_IN_BYTES;

                imageTile[column][row] = rgbToHex(
                    arrayOfImageData[offSetX + offSetY + redIdx],
                    arrayOfImageData[offSetX + offSetY + greenIdx],
                    arrayOfImageData[offSetX + offSetY + blueIdx]
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
     * @param {number} red
     * @param {number} green
     * @param {number} blue
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
        var file = event.dataTransfer.files[0]; // ATM, we're only interested on the first item

        var promise = new Promise(function(resolve, reject) {
            var fileReader = new FileReader();

            if (file.type.indexOf('image') == -1) {
                reject(new Error (errorMessages.ERR_INVALID_TYPE));
            } else {
                fileReader.readAsDataURL(file);
                fileReader.onload = function(event) {
                    resolve(event.target.result, resolve);
                };
                fileReader.onerror = function() {
                    reject(new Error(errorMessages.ERR_FILE_UPLOAD))
                };
            }
        });

        promise
        .then(function(imageFileHandle, resolveCallback) {
            return new Promise(function(resolve, reject) {
                var image = new Image();

                image.src = imageFileHandle;
                image.onload = function() {
                    resolve(this);
                }
                image.onerror = function() {
                    reject(new Error(errorMessages.ERR_IMAGE_LOAD));
                }
            });
        })
        .then(function(sourceImage) {
            generatePhotoMosaic(sourceImage);
        })
        .catch(function(errorMessage) {
            console.log(errorMessage);
        });
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

            return this;
        },
        StartDragDropListener: function() {
            var sourceImage = document.querySelector(options.sourceImageContainerId);

            // Prevents accidental page wipeout
            ['drop', 'dragover'].map(function(event) {
                document.addEventListener(event, function(e) { e.preventDefault() });
            });

            // Attach `drop` listener to drop zone area
            sourceImage.addEventListener('drop', onImageDropEventHandler);
        }
    };
}());