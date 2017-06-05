//
//  Logger.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 11/09/16.
//

import UIKit

///
/// Thin wrapper around NSLog.
///
class Logger {
    
    ///
    /// Minimum log level to show.
    ///
    static var currentLevel: LogLevel = LogLevel.debug
    
    fileprivate let name: String
    
    ///
    /// Build a logger with the given name.
    ///
    init(name: String) {
        self.name = name
    }

    ///
    /// Log the given message at the given level.
    ///
    func log(_ level: LogLevel, message: String) {
        if Logger.currentLevel.rawValue <= level.rawValue {
            NSLog("\(level) - \(self.name) - \(message)")
        }
    }
    
    ///
    /// Log the given message and error at the given level.
    ///
    func log(_ level: LogLevel, message: String, error: Error) {
        if Logger.currentLevel.rawValue <= level.rawValue {
            NSLog("\(level) - \(self.name) - \(message)")
            print(error)
        }
    }
    
    ///
    /// Log the given message at the DEBUG level.
    ///
    func debug(_ message: String) {
        log(.debug, message: message)
    }
    
    ///
    /// Log the given message and error at the DEBUG level.
    ///
    func debug(_ message: String, error: Error) {
        log(.debug, message: message, error: error)
    }
    
    ///
    /// Log the given message at the INFO level.
    ///
    func info(_ message: String) {
        log(.info, message: message)
    }
    
    ///
    /// Log the given message and error at the INFO level.
    ///
    func info(_ message: String, error: Error) {
        log(.info, message: message, error: error)
    }
    
    ///
    /// Log the given message at the WARNING level.
    ///
    func warn(_ message: String) {
        log(.warning, message: message)
    }
    
    ///
    /// Log the given message and error at the WARNING level.
    ///
    func warn(_ message: String, error: Error) {
        log(.warning, message: message, error: error)
    }
    
    ///
    /// Log the given message at the ERROR level.
    ///
    func error(_ message: String) {
        log(.error, message: message)
    }
    
    ///
    /// Log the given message and error at the ERROR level.
    ///
    func error(_ message: String, error: Error) {
        log(.error, message: message, error: error)
    }
}
