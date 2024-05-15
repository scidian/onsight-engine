import { Vector2 } from './Vector2.js';

/**
 * 2D 3x2 transformation matrix, values of the matrix are stored as numeric array.
 *  [ 0 Xx  2 Yx  4 Ox ]
 *  [ 1 Xy  3 Yy  5 Oy ]
 */
class Matrix2 {

    /* Values by row, needs to have exactly 6 values */
    constructor(values) {
        if (Array.isArray(values)) this.m = [ ...values ];
        else this.identity();
    }

    copy(mat) {
        this.m = [ ...mat.m ];
        return this;
    }

    clone() {
        return new Matrix2([ ...this.m ]);
    }

    /** Reset this matrix to identity */
    identity() {
        this.m = [ 1, 0, 0, 1, 0, 0 ];
        return this;
    }

    /** Multiply another matrix by this one and store the result */
    multiply(mat) {
        const m0 = this.m[0] * mat.m[0] + this.m[2] * mat.m[1];
        const m1 = this.m[1] * mat.m[0] + this.m[3] * mat.m[1];
        const m2 = this.m[0] * mat.m[2] + this.m[2] * mat.m[3];
        const m3 = this.m[1] * mat.m[2] + this.m[3] * mat.m[3];
        const m4 = this.m[0] * mat.m[4] + this.m[2] * mat.m[5] + this.m[4];
        const m5 = this.m[1] * mat.m[4] + this.m[3] * mat.m[5] + this.m[5];
        this.m = [ m0, m1, m2, m3, m4, m5 ];
        return this;
    }

    /** Premultiply another matrix by this one and store the result */
    premultiply(mat) {
        const m0 = mat.m[0] * this.m[0] + mat.m[2] * this.m[1];
        const m1 = mat.m[1] * this.m[0] + mat.m[3] * this.m[1];
        const m2 = mat.m[0] * this.m[2] + mat.m[2] * this.m[3];
        const m3 = mat.m[1] * this.m[2] + mat.m[3] * this.m[3];
        const m4 = mat.m[0] * this.m[4] + mat.m[2] * this.m[5] + mat.m[4];
        const m5 = mat.m[1] * this.m[4] + mat.m[3] * this.m[5] + mat.m[5];
        this.m = [ m0, m1, m2, m3, m4, m5 ];
        return this;
    }

    /**
     * Compose this transformation matrix with position scale and rotation and origin point.
     * @param {number} px Position X
     * @param {number} py Position Y
     * @param {number} sx Scale X
     * @param {number} sy Scale Y
     * @param {number} ox Origin X (applied before scale and rotation)
     * @param {number} oy Origin Y (applied before scale and rotation)
     * @param {number} rot Rotation angle (radians).
     */
    compose(px, py, sx, sy, ox, oy, rot) {
        // Position (Translation)
        this.m = [ 1, 0, 0, 1, px, py ];

        // Rotation
        if (rot !== 0) {
            this.multiply(new Matrix2([ 1, 0, 0, 1, +ox, +oy ]));
            const c = Math.cos(rot);
            const s = Math.sin(rot);
            this.multiply(new Matrix2([ c, s, -s, c, 0, 0 ]));
            this.multiply(new Matrix2([ 1, 0, 0, 1, -ox, -oy ]));
        }

        // Scale
        if (sx !== 1 || sy !== 1) this.scale(sx, sy);
        return this;
    }

    decompose(object) {
        if (!object || typeof object !== 'object') return this;
        if (object.position) this.getPosition(object.position);
        object.rotation = this.getRotation();
        if (object.scale) this.getScale(object.scale);
        return this;
    }

    /** Apply translation to this matrix, adds position to transformation already stored in the matrix */
    translate(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
        return this;
    }

    /** Apply rotation to this matrix in radians */
    rotate(rad) {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m11 = this.m[0] * c + this.m[2] * s;
        const m12 = this.m[1] * c + this.m[3] * s;
        const m21 = this.m[0] * -s + this.m[2] * c;
        const m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        return this;
    }

    /** Apply scale to this matrix */
    scale(sx, sy) {
        if (typeof sx === 'object') {
            this.m[0] *= sx.x;
            this.m[1] *= sx.x;
            this.m[2] *= sx.y;
            this.m[3] *= sx.y;
        } else {
            this.m[0] *= sx;
            this.m[1] *= sx;
            this.m[2] *= sy;
            this.m[3] *= sy;
        }
        return this;
    }

    /** Set the position of the transformation matrix */
    setPosition(x, y) {
        this.m[4] = x;
        this.m[5] = y;
        return this;
    }

    /** Extract the scale from the transformation matrix */
    getScale(target = new Vector2()) {
        // https://stackoverflow.com/questions/45159314/decompose-2d-transformation-matrix
        const scaleX = Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
        const scaleY = Math.sqrt(this.m[2] * this.m[2] + this.m[3] * this.m[3]);
        target.set(scaleX, scaleY);
        return target;
    }

    /** Extract the position from the transformation matrix */
    getPosition(target = new Vector2()) {
        target.set(this.m[4], this.m[5]);
        return target;
    }

    /** Extract the rotation angle from the transformation matrix */
    getRotation() {
        return Math.atan2(this.m[1], this.m[0]);
    }

    getShear() {
        const rotation = this.getRotation();
        return Math.atan2(this.m[3], this.m[2]) - (Math.PI / 2) - rotation;
    }

    getSign(target = new Vector2()) {
        const signX = (this.m[0] < 0) ? -1 : 1;
        const signY = (this.m[3] < 0) ? -1 : 1;
        target.set(signX, signY);
        return target;
    }

    /** Apply skew to this matrix */
    skew(radianX, radianY) {
        return this.multiply(new Matrix2([ 1, Math.tan(radianY), Math.tan(radianX), 1, 0, 0 ]));
    }

    /**
     * The determinant of a 2D transformation matrix can indicate if the transformation includes a reflection.
     * A negative determinant means the transformation includes a mirroring.
     */
    determinant() {
        return this.m[0] * this.m[3] - this.m[1] * this.m[2];
    }

    /** Get the inverse matrix */
    getInverse() {
        const d = this.determinant();
        if (d === 0) console.error(`Matrix2.getInverse(): Matrix is non-invertible`);
        const invD = 1 / d;
        return new Matrix2([ this.m[3] * invD, -this.m[1] * invD, -this.m[2] * invD, this.m[0] * invD, invD * (this.m[2] * this.m[5] - this.m[3] * this.m[4]), invD * (this.m[1] * this.m[4] - this.m[0] * this.m[5]) ]);
    }

    /** Transform a point using this matrix, returns new transformed point */
    transformPoint(x, y) {
        let px, py;
        if (typeof x === 'object') {
            px = x.x * this.m[0] + x.y * this.m[2] + this.m[4];
            py = x.x * this.m[1] + x.y * this.m[3] + this.m[5];
        } else {
            px = x * this.m[0] + y * this.m[2] + this.m[4];
            py = x * this.m[1] + y * this.m[3] + this.m[5];
        }
        return new Vector2(px, py);
    }

    /**
     * Set a canvas context to use this transformation
     * @param {CanvasRenderingContext2D} context Canvas context to apply this matrix transform.
     */
    setContextTransform(context) {
        context.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
        return this;
    }

    /**
     * Transform on top of the current context transformation
     * @param {CanvasRenderingContext2D} context Canvas context to apply this matrix transform.
     */
    tranformContext(context) {
        context.transform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
        return this;
    }

    /** CSS transform string that can be applied to the transform style of any DOM element */
    cssTransform() {
        return 'matrix(' + this.m[0] + ',' + this.m[1] + ',' + this.m[2] + ',' + this.m[3] + ',' + this.m[4] + ',' + this.m[5] + ')';
    }

}

export { Matrix2 };
