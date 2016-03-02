# eslint-todo

Linting large existing projects is hard. Lots of a exceptions need to be made for lots of reasons,
and linting directories while keeping commits small can be difficult. This tool enables you to
setup your root `.eslintrc` in your ideal way, then slowly clean up your code base.  It works by
removing any existing nested exceptions to your ruleset, linting, and then adding the tightest
restrictions possible back in.  This enables you to clean up your directory tree a single leaf at
a time without manually adjusting nested `.eslintrc` files.

## Usage

`eslint-todo` requires the command you use for linting to be passed to it, along with any flags your
lint command needs.  Additionally it requires that you format your eslint output as json.

```bash
$ npm install -g eslint-todo
```

```bash
$ eslint-todo <command> -- --flagsToPassToCommand
```
