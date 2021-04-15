export interface IFeature {
    /** The next feature to be given a chance to handle incoming events */
    next: IFeature | null
    /** The cursor I want to be displayed */
    cursor: string | string[] | null
    /** The cell location where the cursor is currently */
    currentHoverCell: Point | null
    /** Set my next field, or if it's populated delegate to the feature in my next field */
    setNext(feature: IFeature): void
    /** Disconnect my child */
    detachChain(): void
    /** Reattach my child from the detached reference */
    attachChain(): void
    /** handle mouse move down the feature chain of responsibility */
    handleMouseMove(grid, event): void
    handleMouseExit(grid, event): void
    handleMouseEnter(grid, event): void
    handleMouseDown(grid, event): void
    handleMouseUp(grid, event): void
    handleKeyDown(grid, event): void
    handleKeyUp(grid, event): void
    handleWheelMoved(grid, event): void
    handleDoubleClick(grid, event): void
    handleClick(grid, event): void
    handleMouseDrag(grid, event): void
    handleContextMenu(grid, event): void
    handleTouchStart(grid, event): void
    handleTouchMove(grid, event): void
    handleTouchEnd(grid, event): void
    moveSingleSelect(grid, x: number, y: number): void
    isFirstFixedRow(grid, event): boolean
    setCursor(grid): void
    initializeOn(grid): void
}
