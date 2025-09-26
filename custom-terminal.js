// custom-terminal.js - Pure HTML/CSS/JS Terminal
class RepoSpaceTerminal {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.lines = [];
        this.currentInput = '';
        this.cursorPosition = 0;
        this.history = [];
        this.historyIndex = -1;
        this.isProcessing = false;
        this.prompt = '$ ';
        
        this.init();
    }
    
    init() {
        // Clear container and set up terminal structure
        this.container.innerHTML = '';
        this.container.className = 'custom-terminal';
        
        // Create terminal display
        this.display = document.createElement('div');
        this.display.className = 'terminal-display';
        this.display.setAttribute('tabindex', '0'); // Make focusable
        this.container.appendChild(this.display);
        
        // Create input line
        this.inputLine = document.createElement('div');
        this.inputLine.className = 'terminal-input-line';
        this.display.appendChild(this.inputLine);
        
        this.updateInputLine();
        this.setupEventListeners();
        this.focus();
        
        // Welcome message
        this.writeLine('RepoSpace IDE Terminal v1.0');
        this.writeLine('Type "help" for available commands');
        this.writeLine('');
    }
    
    setupEventListeners() {
        // Focus management
        this.display.addEventListener('click', () => this.focus());
        
        // Keyboard input
        this.display.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.display.addEventListener('keypress', (e) => this.handleKeyPress(e));
        
        // Prevent default text selection behavior
        this.display.addEventListener('selectstart', (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });
    }
    
    focus() {
        this.display.focus();
        this.display.classList.add('focused');
    }
    
    blur() {
        this.display.classList.remove('focused');
    }
    
    handleKeyDown(e) {
        if (this.isProcessing) return;
        
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand();
                break;
                
            case 'Backspace':
                e.preventDefault();
                this.handleBackspace();
                break;
                
            case 'Delete':
                e.preventDefault();
                this.handleDelete();
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                this.moveCursor(-1);
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                this.moveCursor(1);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;
                
            case 'Home':
                e.preventDefault();
                this.cursorPosition = 0;
                this.updateInputLine();
                break;
                
            case 'End':
                e.preventDefault();
                this.cursorPosition = this.currentInput.length;
                this.updateInputLine();
                break;
                
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.cursorPosition = 0;
                    this.updateInputLine();
                }
                break;
                
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.cursorPosition = this.currentInput.length;
                    this.updateInputLine();
                }
                break;
                
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.interrupt();
                }
                break;
                
            case 'l':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.clear();
                }
                break;
        }
    }
    
    handleKeyPress(e) {
        if (this.isProcessing) return;
        
        const char = e.key;
        if (char.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.insertChar(char);
        }
    }
    
    insertChar(char) {
        const before = this.currentInput.slice(0, this.cursorPosition);
        const after = this.currentInput.slice(this.cursorPosition);
        this.currentInput = before + char + after;
        this.cursorPosition++;
        this.updateInputLine();
    }
    
    handleBackspace() {
        if (this.cursorPosition > 0) {
            const before = this.currentInput.slice(0, this.cursorPosition - 1);
            const after = this.currentInput.slice(this.cursorPosition);
            this.currentInput = before + after;
            this.cursorPosition--;
            this.updateInputLine();
        }
    }
    
    handleDelete() {
        if (this.cursorPosition < this.currentInput.length) {
            const before = this.currentInput.slice(0, this.cursorPosition);
            const after = this.currentInput.slice(this.cursorPosition + 1);
            this.currentInput = before + after;
            this.updateInputLine();
        }
    }
    
    moveCursor(direction) {
        const newPos = this.cursorPosition + direction;
        if (newPos >= 0 && newPos <= this.currentInput.length) {
            this.cursorPosition = newPos;
            this.updateInputLine();
        }
    }
    
    navigateHistory(direction) {
        if (this.history.length === 0) return;
        
        const newIndex = this.historyIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.history.length) {
            this.historyIndex = newIndex;
            this.currentInput = this.history[newIndex];
            this.cursorPosition = this.currentInput.length;
        } else if (newIndex < 0) {
            this.historyIndex = -1;
            this.currentInput = '';
            this.cursorPosition = 0;
        }
        
        this.updateInputLine();
    }
    
    updateInputLine() {
        const before = this.currentInput.slice(0, this.cursorPosition);
        const after = this.currentInput.slice(this.cursorPosition);
        
        this.inputLine.innerHTML = `
            <span class="terminal-prompt">${this.prompt}</span>
            <span class="terminal-input-text">${this.escapeHtml(before)}</span>
            <span class="terminal-cursor ${this.display.classList.contains('focused') ? 'blink' : ''}">|</span>
            <span class="terminal-input-text">${this.escapeHtml(after)}</span>
        `;
        
        this.scrollToBottom();
    }
    
    executeCommand() {
        const command = this.currentInput.trim();
        
        // Add to history
        if (command && (this.history.length === 0 || this.history[this.history.length - 1] !== command)) {
            this.history.push(command);
        }
        this.historyIndex = -1;
        
        // Display command in terminal
        this.writeLine(`${this.prompt}${command}`, 'input');
        
        // Clear current input
        this.currentInput = '';
        this.cursorPosition = 0;
        
        // Process command
        this.processCommand(command);
    }
    
    async processCommand(command) {
        this.isProcessing = true;
        
        if (!command) {
            this.finishCommand();
            return;
        }
        
        const args = command.split(' ').filter(arg => arg.length > 0);
        const cmd = args[0].toLowerCase();
        
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
                
            case 'clear':
            case 'cls':
                this.clear();
                break;
                
            case 'echo':
                this.writeLine(args.slice(1).join(' '));
                break;
                
            case 'pwd':
                this.writeLine('/home/user/workspace');
                break;
                
            case 'ls':
            case 'dir':
                this.listFiles();
                break;
                
            case 'date':
                this.writeLine(new Date().toString());
                break;
                
            case 'whoami':
                this.writeLine('developer');
                break;
                
            case 'uname':
                this.writeLine('RepoSpace IDE Terminal');
                break;
                
            case 'history':
                this.showHistory();
                break;
                
            default:
                this.writeLine(`Command not found: ${cmd}`, 'error');
                this.writeLine('Type "help" for available commands');
        }
        
        this.finishCommand();
    }
    
    showHelp() {
        const commands = [
            ['help', 'Show this help message'],
            ['clear, cls', 'Clear the terminal'],
            ['echo <text>', 'Display text'],
            ['pwd', 'Show current directory'],
            ['ls, dir', 'List files'],
            ['date', 'Show current date'],
            ['whoami', 'Show current user'],
            ['uname', 'Show system info'],
            ['history', 'Show command history']
        ];
        
        this.writeLine('Available commands:');
        commands.forEach(([cmd, desc]) => {
            this.writeLine(`  ${cmd.padEnd(20)} ${desc}`);
        });
    }
    
    listFiles() {
        const files = [
            { name: 'package.json', type: 'file' },
            { name: 'src', type: 'directory' },
            { name: 'README.md', type: 'file' },
            { name: '.git', type: 'directory' },
            { name: 'node_modules', type: 'directory' }
        ];
        
        files.forEach(file => {
            const icon = file.type === 'directory' ? '📁' : '📄';
            this.writeLine(`${icon} ${file.name}`);
        });
    }
    
    showHistory() {
        if (this.history.length === 0) {
            this.writeLine('No command history');
            return;
        }
        
        this.history.forEach((cmd, index) => {
            this.writeLine(`${(index + 1).toString().padStart(4)}: ${cmd}`);
        });
    }
    
    finishCommand() {
        this.isProcessing = false;
        this.updateInputLine();
    }
    
    writeLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        
        // Insert before input line
        this.display.insertBefore(line, this.inputLine);
        this.scrollToBottom();
    }
    
    interrupt() {
        if (this.isProcessing) {
            this.writeLine('^C', 'error');
            this.isProcessing = false;
        }
        this.currentInput = '';
        this.cursorPosition = 0;
        this.updateInputLine();
    }
    
    clear() {
        const lines = this.display.querySelectorAll('.terminal-line');
        lines.forEach(line => line.remove());
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.display.scrollTop = this.display.scrollHeight;
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setTheme(isDark) {
        this.container.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
}

// Export for use in IDE
window.RepoSpaceTerminal = RepoSpaceTerminal;
