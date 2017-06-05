//
//  GoHomeSegue.swift
//  ScanAndTell
//
//  Created by Marc Plouhinec on 18/08/16.
//  Copyright © 2016 Marc Plouhinec. All rights reserved.
//

import UIKit

class TopUIStoryboardSegue: UIStoryboardSegue {
    
    override func perform() {
        let sourceViewController = self.sourceViewController
        let destinationViewController = self.destinationViewController
        let navigationController = sourceViewController.navigationController!
        navigationController.popToRootViewControllerAnimated(false)
        navigationController.pushViewController(destinationViewController, animated: true)
    }
}
