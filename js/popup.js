export class DraggablePopup {
    constructor(popupId) {
        this.popup = document.getElementById(popupId);
        this.container = this.popup.querySelector('.popup-container');
        this.header = this.popup.querySelector('.popup-header');
        this.closeBtn = this.popup.querySelector('.close-btn');
        
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        this.init();
    }
    
    init() {
        // Event listeners per il dragging
        this.header.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));
        
        // Event listener per chiudere
        this.closeBtn.addEventListener('click', this.close.bind(this));
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.close();
            }
        });
        
        // Supporto touch per dispositivi mobili
        this.header.addEventListener('touchstart', this.dragStart.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.dragEnd.bind(this));
    }
    
    dragStart(e) {
        if (e.target === this.closeBtn) return;
        
        if (e.type === "touchstart") {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }
        
        if (e.target === this.header || this.header.contains(e.target)) {
            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
        }
    }
    
    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }
            
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;
            
            this.setTranslate(this.currentX, this.currentY);
        }
    }
    
    dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
        this.header.style.cursor = 'grab';
    }
    
    setTranslate(xPos, yPos) {
        this.container.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
    }
    
    open() {
        this.popup.style.display = 'block';
        // Reset position
        this.currentX = 0;
        this.currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.setTranslate(0, 0);
    }
    
    close() {
        this.popup.style.display = 'none';
    }
}

