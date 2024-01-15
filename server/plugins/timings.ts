const timingMiddleware = eventHandler((event) => {
  const start = Date.now()

  const _end = event.node.res.end;
  event.node.res.end = function (
    chunk: any,
    encoding: BufferEncoding,
    cb?: () => void
  ) {
    const timing = {
      matchedPath: event.context.matchedRoute?.path || '/**',
      path: event.path,
      duration: Date.now() - start,
      statusCode: event.node.res.statusCode,
      cached: Boolean(event.node.res.getHeader('last-modified') && event.node.res.statusCode === 304),
    }
    /**
     * Would be nice to know from the event the Nitro send back a cached reponse
     * 
     * event.context.cacheSent
     * 
     * As well as getting the path of the route if possible
     * 
     * event.context.meta.path (ex: server/routes/modules/[name].get.ts)
     */

    // Defined in CF workers
    if (process.env.SERVER_TIMINGS?.writeDataPoint) {
      process.env.SERVER_TIMINGS.writeDataPoint({
        blobs: [timing.path, timing.matchedPath],
        doubles: [timing.duration, timing.statusCode],
      })
    }
    // console.log('Timing', timing)
    _end.call(event.node.res, chunk, encoding, cb);
    return this;
  }.bind(event.node.res);
});

export default defineNitroPlugin((nitro) => {
  // Always add timing middleware to the beginning of handler stack
  nitro.h3App.stack.unshift({
    route: "/",
    handler: timingMiddleware,
  });
});
