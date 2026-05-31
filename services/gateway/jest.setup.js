const originalEmit = process.emit.bind(process);
process.emit = function (event, ...args) {
  if (event === 'uncaughtException' && args[0]?.message === 'Connection is closed.') {
    return false;
  }
  return originalEmit(event, ...args);
};
