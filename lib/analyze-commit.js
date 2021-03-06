const {isMatchWith, isRegExp, omit} = require('lodash');
const debug = require('debug')('semantic-release:commit-analyzer');
const RELEASE_TYPES = require('./default-release-types');
const compareReleaseTypes = require('./compare-release-types');

/**
 * Find all the rules matching and return the highest release type of the matching rules.
 *
 * @param {Array} releaseRules the rules to match the commit against.
 * @param {Commit} commit a parsed commit.
 * @return {string} the highest release type of the matching rules or `undefined` if no rule match the commit.
 */
module.exports = (releaseRules, commit) => {
  let releaseType;

  releaseRules
    .filter(
      rule =>
        (!rule.breaking || (commit.notes && commit.notes.length > 0)) &&
        isMatchWith(
          commit,
          omit(rule, ['release', 'breaking']),
          (obj, src) =>
            /^\/.*\/$/.test(src) || isRegExp(src) ? new RegExp(/^\/(.*)\/$/.exec(src)[1]).test(obj) : undefined
        )
    )
    .every(match => {
      if (compareReleaseTypes(releaseType, match.release)) {
        releaseType = match.release;
        debug('The rule %o match commit with release type %o', match, releaseType);
        if (releaseType === RELEASE_TYPES[0]) {
          debug('Release type %o is the highest possible. Stop analysis.', releaseType);
          return false;
        }
      } else {
        debug(
          'The rule %o match commit with release type %o but the higher release type %o has already been found for this commit',
          match,
          match.release,
          releaseType
        );
      }
      return true;
    });

  return releaseType;
};
