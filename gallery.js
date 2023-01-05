const Gallery = (() => {

    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function animate(duration, callback) {
        return new Promise(resolve => {
            let startTime = Date.now();
            let f = () => {
                let k = (Date.now() - startTime) / duration;
                if (k > 1) k = 1;
    
                k = easeInOutCubic(k);
                callback(k);
                if (k < 1) {
                    requestAnimationFrame(f);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(f);
        });
    }

    class Gallery {
        constructor(target, tileRatio) {
            if (typeof target === "string") {
                target = document.querySelector(target);
            }

            // Ensure that root node is given correctly.
            if (!(target instanceof Element)) {
                throw "Invalid target given to the gallery constructor (node or css-selector required).";
            }

            this._animationDuration = 250;
            this.rootNode = target;
            this.tileRatio = tileRatio;
            this.categories = {};
            this.filteredCategory = '';

            // Define row capacity
            this.rowCapacity = target.dataset.rowCapacity === undefined ? 3 : parseInt(target.dataset.rowCapacity);
            if (isNaN(this.rowCapacity)) this.rowCapacity = 3;

            // Define tiles gap
            this.gapSize = target.dataset.gap === undefined ? 3 : parseInt(target.dataset.gap);
            if (isNaN(this.gapSize)) this.gapSize = 3;

            // Ensure that position of the root element is not static
            let s = getComputedStyle(target);
            if (s.position === "static") {
                target.style.position = "relative";
            }

            // Make array of items
            let items = target.getElementsByClassName("gallery-item");
            this.items = Array.prototype.slice.call(items);

            

            for (let i = 0; i < this.items.length; i++) {
                // Distribute items by category
                if (this.items[i].dataset.category !== undefined) {
                    let categories = this.items[i].dataset.category.split(",");
                    for (let j = 0; j < categories.length; j++) {
                        let category = categories[j].trim();
                        if (!this.categories.hasOwnProperty(category)) this.categories[category] = [];
                        this.categories[category].push(this.items[i]);
                    }
                }
                console.log(this.categories);
            

                // Define image tile width and height
                let w = 1, h = 1;
                if (this.items[i].dataset.size !== undefined) {
                    let a = this.items[i].dataset.size.split("/");
                    if (a.length > 0) w = parseInt(a[0]);
                    if (isNaN(w) || w <= 0 || w > this.rowCapacity) {
                        w = 1;
                        console.error("Invalid width specified for " + i + " gallery item.");
                    }
                    if (a.length > 1) h = parseInt(a[1]);
                    if (isNaN(h) || h <= 0) {
                        h = 1;
                        console.error("Invalid height specified for " + i + " gallery item.");
                    }
                }
                this.items[i]._w = w; this.items[i]._h = h;

                // Apply some styles
                this.items[i].style.position = "absolute";
            }

            this.rootNode._gallery = this;
            this.adjustTiles();
        }

        set animationDuration(duration) {
            this._animationDuration = duration;
        }

        adjustTiles() {
            let tileWidth = (this.rootNode.clientWidth - (this.gapSize * (this.rowCapacity - 1))) / this.rowCapacity;
            let tileHeight = tileWidth * (2 - this.tileRatio);

            let x = 0;
            let y = 0;
            let takenCells = [];
            let categoryExists = this.categories.hasOwnProperty(this.filteredCategory);
            for (let i = 0; i < this.items.length; i++) {
                // Adjust size
                this.items[i].style.width = tileWidth * this.items[i]._w + (this.gapSize * (this.items[i]._w - 1)) + 'px';
                this.items[i].style.height = tileHeight * this.items[i]._h + (this.gapSize * (this.items[i]._h - 1)) + 'px';

                
                // Adjust position
                if (!categoryExists || this.categories[this.filteredCategory].includes(this.items[i])) {
                    if (x + this.items[i]._w > this.rowCapacity) {
                        x = 0; y++;
                    }
                    while (takenCells.includes(x + "/" + y)) {
                        x++;
                        if (x >= this.rowCapacity) {
                            x = 0; y++;
                        }
                    }
                    this.items[i].style.left = tileWidth * x + (this.gapSize * x) + "px";
                    this.items[i].style.top = tileHeight * y + (this.gapSize * y) + "px";
    
                    takenCells.push(x + "/" + y);
                    for (let j = 0; j < this.items[i]._w; j++) {
                        for (let k = 0; k < this.items[i]._h; k++) {
                            takenCells.push((x + j) + "/" + (y + k));
                        }
                    }
    
                    x += this.items[i]._w;
                }
            }

            this.rootNode.style.height = (y + 1) * tileHeight + (this.gapSize * y) + "px";
        }


        filter(category) {
            this.filteredCategory = category;
            let tileWidth = (this.rootNode.clientWidth - (this.gapSize * (this.rowCapacity - 1))) / this.rowCapacity;
            let tileHeight = tileWidth * (2 - this.tileRatio);

            let categoryExists = this.categories.hasOwnProperty(category);
            let x = 0;
            let y = 0;
            let takenCells = [];
            for (let i = 0; i < this.items.length; i++) {
                let item = this.items[i];

                let opacity = parseInt(item.style.opacity);
                let scale = parseInt(item.style.transform.replace('scale(', '').replace(')', ''));
                if (isNaN(opacity)) opacity = 1;
                if (isNaN(scale)) scale = 1;
                
                if (!categoryExists || this.categories[category].includes(item)) {

                    // Calculate new position
                    if (x + item._w > this.rowCapacity) {
                        x = 0; y++;
                    }
                    while (takenCells.includes(x + "/" + y)) {
                        x++;
                        if (x >= this.rowCapacity) {
                            x = 0; y++;
                        }
                    }
                    let left = tileWidth * x + (this.gapSize * x);
                    let top = tileHeight * y + (this.gapSize * y);
                    
    
                    takenCells.push(x + "/" + y);
                    for (let j = 0; j < this.items[i]._w; j++) {
                        for (let k = 0; k < this.items[i]._h; k++) {
                            takenCells.push((x + j) + "/" + (y + k));
                        }
                    }
                    x += this.items[i]._w;

                    let initialLeft = parseInt(item.style.left.replace('px', ''));
                    let initialTop = parseInt(item.style.top.replace('px', ''));

                    animate(this._animationDuration, k => {
                        item.style.opacity = (opacity + ((1 - opacity) * k)).toFixed(3);
                        item.style.transform = 'scale(' + (scale + ((1 - scale) * k)) + ')';

                        item.style.left = initialLeft + ((left - initialLeft) * k) + "px";
                        item.style.top = initialTop + ((top - initialTop) * k) + "px";
                    });
                } else {
                    animate(this._animationDuration, k => {
                        item.style.opacity = (opacity - (opacity * k)).toFixed(3);
                        item.style.transform = 'scale(' + (scale - (scale * k)) + ')';
                    });
                }
            }
        }
    }


    // Update all galleries on window resize
    let updateReady = true;
    window.addEventListener("resize", () => {
        updateReady = false;
        requestAnimationFrame(() => {
            let galleries = document.getElementsByClassName('gallery');
            for (let i = 0; i < galleries.length; i++) {
                if (galleries[i]._gallery instanceof Gallery) {
                    galleries[i]._gallery.adjustTiles();
                }
            }
            updateReady = true;
        });
    });


    return Gallery;
})();

