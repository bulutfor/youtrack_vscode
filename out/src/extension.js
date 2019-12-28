'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const https = require("https");
const xml2js = require("xml2js");
const pug = require("pug");
const childProcess = require("child_process");
const nodeGitLab = require("node-gitlab");
const querystring = require("querystring");
const moment = require("moment");
const ytLog = vscode.window.createOutputChannel('Youtrack');
function activate(context) {
    try {
        let globalIssues;
        class _git {
            branch(branchName) {
                let bStat = childProcess.exec('git checkout -b "' + branchName + '"', {
                    cwd: vscode.workspace.rootPath
                }, (err, stdout, stderr) => {
                    if (err) {
                        vscode.window.showErrorMessage('Git create branch error:' + err);
                        return;
                    }
                    vscode.window.showInformationMessage(stderr);
                });
            }
            currentBranch() {
                return new Promise((resolve, reject) => {
                    let bStat = childProcess.exec('git symbolic-ref --short HEAD', {
                        cwd: vscode.workspace.rootPath
                    }, (err, stdout, stderr) => {
                        if (err) {
                            reject(err);
                        }
                        else
                            resolve(stdout);
                    });
                });
            }
            checkout(branchName) {
                return new Promise((resolve, reject) => {
                    let bStat = childProcess.exec('git checkout ' + branchName, {
                        cwd: vscode.workspace.rootPath
                    }, (err, stdout, stderr) => {
                        if (err) {
                            vscode.window.showErrorMessage('Git checkout error:' + err);
                            reject(err);
                        }
                        else
                            resolve();
                    });
                });
            }
            merge(branchName) {
                return new Promise((resolve, reject) => {
                    let bStat = childProcess.exec('git merge ' + branchName, {
                        cwd: vscode.workspace.rootPath
                    }, (err, stdout, stderr) => {
                        if (err) {
                            vscode.window.showErrorMessage('Git merge error:' + err);
                            reject(err);
                        }
                        else
                            resolve();
                    });
                });
            }
            deleteBranch(branchName) {
                return new Promise((resolve, reject) => {
                    let bStat = childProcess.exec('git branch -d "' + branchName + '"', {
                        cwd: vscode.workspace.rootPath
                    }, (err, stdout, stderr) => {
                        if (err) {
                            vscode.window.showErrorMessage('Git delete branch error:' + err);
                            reject(err);
                        }
                        else
                            resolve();
                    });
                });
            }
        }
        class TD {
            constructor() {
                this._onDidChange = new vscode.EventEmitter();
            }
            provideTextDocumentContent(uri, token) {
                const compiledFunction = pug.compileFile(__dirname + '/index.pug');
                return compiledFunction({
                    issues: globalIssues.issueCompacts.issue
                });
            }
        }
        const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 250);
        status.command = 'youtrack.list';
        status.text = 'Youtrack';
        status.show();
        context.subscriptions.push(status);
        let registryJSON;
        let registryJSONPath;
        let start;
        let handled = false;
        function registryJSONUpdate() {
            fs.writeFile(registryJSONPath, JSON.stringify(registryJSON), err => {
                if (err)
                    console.log(err);
            });
        }
        function statusUpdate() {
            let duration = moment.duration(registryJSON['spentTime'] || 0);
            status.text = `YT: ${registryJSON['currentBranch']} Spent Time: ${duration.humanize()}`;
        }
        function addSpentTimes() {
            return __awaiter(this, void 0, void 0, function* () {
                for (let spent in registryJSON['spentTimes']) {
                    let zaman = registryJSON['spentTimes'][spent] / 1000;
                    if (zaman > 60) {
                        yield yt.addSpent(registryJSON['currentBranch'], spent, Math.round(zaman / 60));
                    }
                }
            });
        }
        function spentTimeHandler() {
            if (!handled) {
                vscode.window.onDidChangeWindowState(event => {
                    handled = true;
                    if (registryJSON['currentBranch'] !== undefined) {
                        if (event.focused) {
                            start = (new Date).getTime();
                        }
                        else if (!event.focused && start !== undefined) {
                            if (registryJSON !== undefined) {
                                let end = (new Date).getTime() - start;
                                let ts = moment(moment().format('YYYY-MM-DD 00:00')).valueOf();
                                if (registryJSON['spentTimes'] === undefined) {
                                    registryJSON['spentTimes'] = {};
                                    registryJSON['spentTimes'][ts] = end;
                                }
                                else {
                                    if (registryJSON['spentTimes'][ts] === undefined) {
                                        registryJSON['spentTimes'][ts] = end;
                                    }
                                    else {
                                        registryJSON['spentTimes'][ts] = registryJSON['spentTimes'][ts] + end;
                                    }
                                }
                                registryJSON['spentTime'] = (registryJSON['spentTime'] || 0) + end;
                                start = undefined;
                                registryJSONUpdate();
                                statusUpdate();
                            }
                        }
                    }
                });
            }
        }
        // const myExtDir = vscode.extensions.getExtension('bulut4.youtrack').extensionPath;
        let wsf = vscode.workspace.workspaceFolders;
        let path;
        if (wsf !== undefined && wsf.length > 0) {
            path = wsf[0].uri.path;
        }
        else {
            vscode.window.showErrorMessage('Youtrack extension only running on workspace.');
            return;
        }
        registryJSONPath = path + '/.vscode/youtrackRegistry.json';
        fs.readFile(registryJSONPath, 'utf-8', (err, data) => {
            if (!err) {
                try {
                    registryJSON = JSON.parse(data);
                    if (registryJSON['opened'] !== undefined) {
                        status.text = registryJSON['opened'];
                        spentTimeHandler();
                        statusUpdate();
                    }
                }
                catch (err) {
                    registryJSON = {};
                }
            }
            else
                registryJSON = {};
        });
        let config = vscode.workspace.getConfiguration('youtrack');
        let yt = new youTrack(config.get('userName', ''), config.get('password', ''), config.get('host', ''), config.get('filter', ''), config.get('path', ''));
        let provider = new TD();
        let registration = vscode.workspace.registerTextDocumentContentProvider('css-preview', provider);
        context.subscriptions.push(registration);
        let git = new _git();
        function branchQuickPick(args) {
            return __awaiter(this, void 0, void 0, function* () {
                const value = yield vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: `${args} create this branch ?` });
                if (value === 'Yes') {
                    let branchName = yield git.currentBranch();
                    registryJSON['parentBranch'] = branchName.trim();
                    registryJSON['opened'] = args;
                    registryJSON['currentBranch'] = args;
                    registryJSONUpdate();
                    spentTimeHandler();
                    status.text = args;
                    git.branch(args);
                    let data = yield yt.setState(args, 'In Progress');
                }
            });
        }
        context.subscriptions.push(vscode.commands.registerCommand('youtrack.branch', (args) => __awaiter(this, void 0, void 0, function* () {
            yield branchQuickPick(args);
        })));
        function gitLabPipelineTrigger(token, ref, projectId) {
            return new Promise((resolve, reject) => {
                let options = {
                    host: 'gitlab.com',
                    port: 443,
                    path: `/api/v4/projects/${projectId}/trigger/pipeline`,
                    method: 'POST'
                };
                let postReq = https.request(options, function (res) {
                    res.setEncoding('utf8');
                    let data = '';
                    res.on('data', function (chunk) {
                        data += chunk;
                    });
                    res.on('end', function () {
                        if (res.statusCode === 201) {
                            resolve();
                        }
                        else
                            reject(data);
                    });
                    res.on('err', err => reject(err));
                });
                postReq.write(querystring.stringify({ token: token, ref: ref }));
                postReq.end();
            });
        }
        context.subscriptions.push(vscode.commands.registerCommand('youtrack.closeIssue', () => __awaiter(this, void 0, void 0, function* () {
            let actionType = config.get('closeIssueActionType', 'merge');
            let currentBranch = registryJSON['currentBranch'];
            if (actionType === 'merge') {
                yield git.checkout(registryJSON['parentBranch']);
                yield git.merge(registryJSON['currentBranch']);
                yield git.deleteBranch(registryJSON['currentBranch']);
                yield yt.setState(registryJSON['currentBranch'], 'Fixed');
                yield addSpentTimes();
                delete registryJSON['parentBranch'];
                delete registryJSON['opened'];
                delete registryJSON['currentBranch'];
                delete registryJSON['spentTime'];
                delete registryJSON['spentTimes'];
                registryJSONUpdate();
            }
            else if (actionType === 'mergeRequestGitLab') {
                try {
                    status.text = 'YT:Gitlab login';
                    let gitLabClient = nodeGitLab.createPromise({
                        api: 'https://gitlab.com/api/v4',
                        privateToken: config.get('gitLabPrivateToken', '')
                    });
                    status.text = 'YT:Merge request create';
                    let mergeRequest = yield gitLabClient.mergeRequests.create({
                        id: config.get('gitLabProjectId', null),
                        source_branch: registryJSON['currentBranch'],
                        target_branch: registryJSON['parentBranch'],
                        title: 'Issue ' + registryJSON['currentBranch']
                    });
                    status.text = 'YT:Git checkout';
                    yield git.checkout(registryJSON['parentBranch']);
                    status.text = 'YT:Git delete branch';
                    yield git.deleteBranch(registryJSON['currentBranch']);
                    status.text = 'YT:Set state fixed';
                    yield yt.setState(registryJSON['currentBranch'], 'Fixed');
                    status.text = 'YT:Add spent times';
                    yield addSpentTimes();
                    status.text = 'Youtrack';
                    delete registryJSON['parentBranch'];
                    delete registryJSON['opened'];
                    delete registryJSON['currentBranch'];
                    delete registryJSON['spentTimes'];
                    delete registryJSON['spentTime'];
                    registryJSONUpdate();
                    vscode.window.showInformationMessage(`Merge request created: ${mergeRequest.id}`);
                }
                catch (err) {
                    yield yt.setState(registryJSON['currentBranch'], 'Fixed');
                    yield addSpentTimes();
                    delete registryJSON['parentBranch'];
                    delete registryJSON['opened'];
                    delete registryJSON['currentBranch'];
                    delete registryJSON['spentTime'];
                    delete registryJSON['spentTimes'];
                    registryJSONUpdate();
                    vscode.window.showErrorMessage(`Merge request create error: ${err.message}`);
                }
            }
            let val = config.get('closeIssueTriggerGitLabPipeLine', false);
            if (val) {
                let token = config.get('gitLabPipelineTriggerToken', '');
                let projectId = config.get('gitLabProjectId', null);
                if (projectId === null) {
                    vscode.window.showErrorMessage('GitLab Project Id is missing.');
                    return;
                }
                if (token === '') {
                    vscode.window.showErrorMessage('GitLab Pipeline Trigger Token is missing.');
                    return;
                }
                try {
                    yield gitLabPipelineTrigger(token, currentBranch, projectId);
                    vscode.window.showInformationMessage('GitLab pipeline triggered.');
                }
                catch (err) {
                    vscode.window.showErrorMessage(`GitLab Pipeline Trigger error:${err}`);
                }
            }
            status.text = 'Youtrack';
        })));
        context.subscriptions.push(vscode.commands.registerCommand('youtrack.list', () => {
            status.text = 'YT:Login';
            yt.login()
                .then(() => yt.getIssue()
                .then(issues => {
                status.text = 'YT:Get issues';
                let prs = new xml2js.Parser();
                prs.parseString(issues, ((err, res) => {
                    if (err) {
                        ytLog.appendLine('YT:ParseString:' + err.stack);
                        vscode.window.showErrorMessage('Youtrack issues list error:' + err.message);
                        return;
                    }
                    globalIssues = res;
                    const panel = vscode.window.createWebviewPanel('youtrackIssueList', 'Youtrack Issue List', vscode.ViewColumn.Two, {
                        enableScripts: true
                    });
                    const compiledFunction = pug.compileFile(__dirname + '/index.pug');
                    panel.webview.html = compiledFunction({
                        issues: globalIssues.issueCompacts.issue
                    });
                    panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                        switch (message.command) {
                            case 'did-click-link':
                                yield branchQuickPick(message.data);
                                return;
                        }
                    }), undefined, context.subscriptions);
                    /*
                    vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse('css-preview://test'), vscode.ViewColumn.Two, 'Youtrack Issue List').then((success) => {
                    }, (reason) => {
                        vscode.window.showErrorMessage(reason);
                    });*/
                }));
            }))
                .catch(err => {
                ytLog.appendLine('YT:Login:' + err.stack);
                vscode.window.showErrorMessage('Youtrack login error:' + err.message);
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('youtrack.triggerGitlabPipeLine', () => __awaiter(this, void 0, void 0, function* () {
            let token = config.get('gitLabPipelineTriggerToken', '');
            let projectId = config.get('gitLabProjectId', null);
            let currentBranch = registryJSON['currentBranch'];
            if (projectId === null) {
                vscode.window.showErrorMessage('GitLab Project Id is missing.');
                return;
            }
            if (token === '') {
                vscode.window.showErrorMessage('GitLab Pipeline Trigger Token is missing.');
                return;
            }
            try {
                yield gitLabPipelineTrigger(token, currentBranch, projectId);
                vscode.window.showInformationMessage('GitLab pipeline triggered.');
            }
            catch (err) {
                vscode.window.showErrorMessage(`GitLab Pipeline Trigger error:${err}`);
            }
        })));
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor.document) {
                // provider.update(previewUri);
            }
        });
    }
    catch (err) {
        vscode.window.showErrorMessage(`Youtrack extension activate error:${err.message}`);
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class youTrack {
    constructor(userName, password, host, filter, path) {
        this._login = false;
        this.host = host;
        this.userName = userName;
        this.password = password;
        this.filter = filter;
        this.basePath = path;
    }
    httpPost(path, method, data = null) {
        let self = this;
        let loginRequest = path.indexOf('/rest/user/login') > -1;
        let spentRequest = path.indexOf('/timetracking/workitem') > -1;
        return new Promise((resolve, reject) => {
            let options = {
                host: this.host.replace('https://', ''),
                port: 443,
                path: self.basePath !== '/' ? self.basePath + path : path,
                method: method,
                headers: {
                    'Content-Type': (spentRequest ? 'application/xml' : 'application/json'),
                    'Cache-Control': 'no-cache'
                }
            };
            if (self._login) {
                options.headers['Cookie'] = self.cookie;
            }
            let postReq = https.request(options, function (res) {
                res.setEncoding('utf8');
                let data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    if (loginRequest) {
                        self.cookie = res.headers['set-cookie'];
                        if (data === '<login>ok</login>') {
                            self._login = true;
                            resolve(data);
                        }
                        else
                            reject(new Error('User name or password is incorrect.'));
                    }
                    else
                        resolve(data);
                });
                res.on('error', err => reject(err));
            });
            
            postReq.on('error', err => reject(err));
            
            if (data !== null) {
                postReq.write(data);
            }
            postReq.end();
        });
    }
    login() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.httpPost('/rest/user/login?login=' + encodeURIComponent(self.userName) + '&password=' + encodeURI(self.password), 'POST')
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }
    getIssue() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.httpPost('/rest/issue?filter=' + encodeURIComponent(self.filter) + '&max=100', 'GET')
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }
    setState(issueId, state) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.httpPost('/rest/issue/' + issueId + '/execute?command=' + encodeURIComponent('State ' + state), 'POST')
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }
    setEstimate(issueId, estimate) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.httpPost('/rest/issue/' + issueId + '/execute?command=' + encodeURIComponent('Estimation ' + estimate), 'POST')
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }
    addSpent(issueId, date, time) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.httpPost(`/rest/issue/${issueId}/timetracking/workitem`, 'POST', `<workItem>
                <date>${date}</date>
                <duration>${time}</duration>
                <description>Test</description>
                <worktype>
                    <name>Development</name>
                </worktype>
            </workItem>
            `)
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }
}
//# sourceMappingURL=extension.js.map
