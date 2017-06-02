//
// Miscellaneous Utilities
//
// Various utilities to support other classes.
//
const Transform = require('stream').Transform
const Writeable = require('stream').Writable

class NewLineCounterStream extends Writeable {
    constructor(options){
        super(options)
        this.numberLines = 0
    }

    _write(chunk, encoding, callback){
        this.numberLines += chunk.toString().match(/\n/g).length
        callback()
    }
}

class TailStream extends Transform {
    constructor(startLine, options){
        super(options)
        this.currentLine = 0
        this.startLine = startLine
    }

    _transform(chunk, encoding, callback) {
        if (this.currentLine < this.startLine){
            let chunksegments = chunk.toString().match(/(.*\n)/g)
            if (this.currentLine + chunksegments.length < this.startLine){ this.currentLine += chunksegments.length }
            else {
                // Ensure we grab a partial last line if necessary.
                let chunksegments = chunk.toString().match(/(.*\n)|(.+$)/g)
                while (this.currentLine < this.startLine){
                    chunksegments.shift()
                    this.currentLine++
                }
                chunksegments.forEach( i => { this.push(i) } )
            }
        }
        else {
            this.push(chunk)
        }
        callback()
    }
}

module.exports = { NewLineCounterStream, TailStream }