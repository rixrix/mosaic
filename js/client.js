
document.addEventListener('drop', function(event) {
    event.preventDefault();
});

document.addEventListener('dragenter', function(event){
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

    reader.onload = (function() {
        console.log(reader.result);
    });


    console.log(file);
}