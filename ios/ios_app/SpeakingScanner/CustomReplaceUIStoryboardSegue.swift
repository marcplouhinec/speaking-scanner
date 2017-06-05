//
//  CustomReplaceUIStoryboardSegue.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 19/08/16.
//
//  Thanks to http://stackoverflow.com/questions/21414786/instead-of-push-segue-how-to-replace-view-controller-or-remove-from-navigation
//

import UIKit

class CustomReplaceUIStoryboardSegue: UIStoryboardSegue  {
    
    override func perform() {
        let navigationController: UINavigationController = source.navigationController!
        
        var controllerStack = navigationController.viewControllers
        let index = controllerStack.index(of: source)
        controllerStack[index!] = destination
        
        navigationController.setViewControllers(controllerStack, animated: true)
    }

}
