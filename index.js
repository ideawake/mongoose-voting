/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId;

/**
 * Expose mongoose voting
 */

module.exports = exports = voting;

/**
 * Mongoose Voting Plugin
 *
 * @param {Schema} schema MongooseSchema
 * @param {Object} options for plugin configuration
 * @api public
 */

function voting (schema, options) {
  options || ( options = {} );

  var voterModelName = options.ref || 'User';

  schema.add({
    vote: {
      positive: [{type: ObjectId, ref: voterModelName}],
      negative: [{type: ObjectId, ref: voterModelName}]
    }
  });


  schema.add({
    voteHistory: {
      positive: [{user: {type: ObjectId, ref: voterModelName}, timeStamp: {type: Date, default: Date.now}}],
      negative: [{user: {type: ObjectId, ref: voterModelName}, timeStamp: {type: Date, default: Date.now}}]
    }
  });


  schema.methods.upvote = function upvote(user, fn) {
    // Reset vote if existed

    this.vote.negative.pull(user);
    this.voteHistory.negative.pull({user:user}); // this does not work

    // Upvote
    this.vote.positive.addToSet(user);
    this.voteHistory.positive.addToSet({user: user});

    // If callback fn, save and return
    if (2 === arguments.length) {
      this.save(fn);
    };
  };

  schema.methods.downvote = function downvote(user, fn) {
    // Reset vote if existed
    this.vote.positive.pull(user);
    this.voteHistory.positive.pull({user:user}); // this does not work

    // Downvote
    this.vote.negative.addToSet(user);
    this.voteHistory.negative.addToSet({user: user});

    // If callback fn, save and return
    if (2 === arguments.length) {
      this.save(fn);
    };
  };

  schema.methods.unvote = function unvote(user, fn) {
    this.vote.negative.pull(user);
    this.vote.positive.pull(user);
    this.voteHistory.positive.pull({user: mongoose.Types.ObjectId(user)}); // this does not work
    this.voteHistory.negative.pull({user: mongoose.Types.ObjectId(user)}); // this does not work

    // Remove from voteTimes set

    // If callback fn, save and return
    if (2 === arguments.length) {
      this.save(fn);
    };
  }

  schema.methods.upvoted = function upvoted(user) {
    if (user._id) {
      return schema.methods.upvoted.call(this, user._id);
    };

    return !!~this.vote.positive.indexOf(user);
  };

  schema.methods.downvoted = function downvoted(user) {
    if (user._id) {
      return schema.methods.downvoted.call(this, user._id);
    };

    return !!~this.vote.negative.indexOf(user);
  };

  schema.methods.voted = function voted(user) {
    if (user._id) {
      return schema.methods.voted.call(this, user._id);
    };

    return schema.methods.upvoted.call(this, user) || schema.methods.downvoted.call(this, user);
  }

  schema.methods.upvotes = function upvotes() {
    return this.vote.positive.length;
  }

  schema.methods.downvotes = function upvotes() {
    return this.vote.negative.length;
  }

  schema.methods.votes = function upvotes() {
    var positives = this.vote.positive;
    var negatives = this.vote.negative;
    return [].concat(positives).concat(negatives).length;
  }

}
