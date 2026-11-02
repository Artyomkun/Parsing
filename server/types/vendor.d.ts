declare module 'ffprobe-static' {
    const ffprobe: { path: string };
    export default ffprobe;
}

declare module '@gumlet/fluent-ffmpeg' {
    import ffmpeg = require('fluent-ffmpeg');
    export = ffmpeg;
}
