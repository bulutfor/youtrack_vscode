# YouTrack Extension README

Issue list and git integrated task extension for YouTrack Issue management tool.

## Step by Step Installation
1. Install extension in VSCode extension manager (View -> Extensions) and reload VSCode.
![](https://www.bulut4.com/images/youtrack/step1.gif)

2. Open settings menu and write custom settings. (View->Command Palette->User Settings)
![](https://www.bulut4.com/images/youtrack/step2.gif)

3. Open Command Palette (View->Command Palette) and write Youtrack: Issue List
![](https://www.bulut4.com/images/youtrack/step3.gif)

4. Open any issue click "Open Issue" link on Youtrack List side. Extension create git branch automatically and checkout this branch. Issue "State" field value changed to "In Progress" on Youtrack.

5. You finish work in this issue, open command palette and write "Youtrack: Close Issue". Extension merge git branch to base branch and issue "State" field value changed to "Fixed" on Youtrack.

Extension supported functionalty like a webstorm youtrack extension functionalty.

## Features

* Issue list.
* Issue search query. (YQL)
* Automaticly create branch in issue opened.
* Issue state change on issue opened. (State=Inprogress)
* Issue state change on issue closed. (State=Fixed)
* Automaticly merge branch to parent branch in issue closed.

## Requirements


## Extension Settings

Any few settings for extension.

* `youtrack.userName`: YouTrack user name.
* `youtrack.password`: YouTrack password.
* `youtrack.host`: YouTrack server host address. Eg: xyz.jetbrains.com
* `youtrack.path`: YouTrack server path. Eg: /youtrack
* `youtrack.filter`: YouTrack search query. It's using on issue list. Eg: (assigned to: me or Assignee: me) and #Unresolved and sort by: updated
* `youtrack.closeIssueActionType`: If set merge option, this extension merge branch to master branch on close issue command. Setting mergeRequestGitLab option, extension create to merge request using GitLab API.
* `youtrack.gitLabPrivateToken`: GitLab private token for merge request.
* `youtrack.gitLabProjectId`: GitLab project id for merge request.
* `youtrack.closeIssueTriggerGitLabPipeLine`: Close issue on trigger gitlab ci pipeline. If set true you must set GitLab Pipeline Trigger Token.
* `youtrack.gitLabPipelineTriggerToken`: Gitlab Pipeline Trigger Token more information https://docs.gitlab.com/ee/ci/triggers/

## Known Issues

Please issue on github.

## Release Notes

### 0.0.1

First release.

### 0.0.5

Step by step installation guide and bug fixed.

### 0.0.6

Settings definition. Added confirm dialog.

### 0.0.9

Fixed issue where extension not active when starting vscode. Settings no longer on globally, using will only workspace. Added gitlab merge request close issue action type. If you choose mergeRequestGitlab action type, extension create merge request on GitLab.

### 0.0.10

Added GitLab pipeline trigger feature.

### 0.0.11

Documentation updated.

### 0.0.13

Youtrack issue list problem fixed.

### 0.0.16

Time tracking added. Close issue command, add spent time on Youtrack. You see spent time on Youtrack extension status bar text tooltip. Must before you set time tracking settings activated on YouTrack.

**Enjoy!**