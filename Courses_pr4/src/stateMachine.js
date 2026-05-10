const { States, Events } = require('./states');
const { metrics } = require('./metrics');
const { log } = require('./logger');
const { compensateBooking } = require('./compensation');
const {
  stepAccept,
  stepBook,
  stepIssue,
  stepComplete
} = require('./steps');

const transitionTable = {
  [States.NEW]: {
    [Events.ACCEPT]: { handler: stepAccept, target: States.APPLY_RECEIVED }
  },
  [States.APPLY_RECEIVED]: {
    [Events.BOOK]: { handler: stepBook, target: States.BOOKED }
  },
  [States.BOOKED]: {
    [Events.ISSUE]: { handler: stepIssue, target: States.ACCESS_ISSUED, compensateOnFail: true }
  },
  [States.ACCESS_ISSUED]: {
    [Events.COMPLETE]: { handler: stepComplete, target: States.COMPLETED }
  },
  [States.ERROR]: {
    [Events.COMPENSATE]: { handler: null, target: States.COMPENSATED, isCompensation: true }
  }
};

async function applyTransition(processId, currentState, event, correlationId, context) {
  log(correlationId, 'transition.attempt', { processId, from: currentState, event });

  const rule = transitionTable[currentState] && transitionTable[currentState][event];

  if (!rule) {
    metrics.error();
    log(correlationId, 'transition.invalid', { processId, from: currentState, event });
    return {
      newState: currentState,
      newContext: context,
      error: `Недопустимый переход: из состояния "${currentState}" по событию "${event}"`
    };
  }

  try {
    let newContext = context;
    if (rule.handler) {
      newContext = await rule.handler(processId, correlationId, context);
    }
    metrics.success();
    log(correlationId, 'transition.success', {
      processId,
      from: currentState,
      to: rule.target,
      event
    });
    return { newState: rule.target, newContext };
  } catch (err) {
    metrics.error();
    log(correlationId, 'transition.failed', {
      processId,
      from: currentState,
      event,
      error: err.message
    });

    if (rule.compensateOnFail) {
      log(correlationId, 'compensation.trigger', { processId, failedStep: event });
      await compensateBooking(processId, correlationId, context);
      return {
        newState: States.COMPENSATED,
        newContext: { ...context, compensationDone: true, lastError: err.message }
      };
    }

    return {
      newState: States.ERROR,
      newContext: { ...context, lastError: err.message },
      error: err.message
    };
  }
}

module.exports = { applyTransition };
