import Foundation
import Capacitor
import AuthenticationServices

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var currentCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        self.currentCall = call

        DispatchQueue.main.async {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = self.currentCall else { return }
        self.currentCall = nil

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Invalid credential type")
            return
        }

        var result: [String: Any] = [:]

        if let identityToken = credential.identityToken,
           let tokenString = String(data: identityToken, encoding: .utf8) {
            result["identityToken"] = tokenString
        }

        if let authorizationCode = credential.authorizationCode,
           let codeString = String(data: authorizationCode, encoding: .utf8) {
            result["authorizationCode"] = codeString
        }

        result["user"] = credential.user
        result["email"] = credential.email ?? ""

        if let fullName = credential.fullName {
            var nameComponents: [String: String] = [:]
            if let givenName = fullName.givenName {
                nameComponents["givenName"] = givenName
            }
            if let familyName = fullName.familyName {
                nameComponents["familyName"] = familyName
            }
            result["fullName"] = nameComponents
        }

        result["realUserStatus"] = credential.realUserStatus.rawValue

        call.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithError error: Error) {
        guard let call = self.currentCall else { return }
        self.currentCall = nil

        let authError = error as? ASAuthorizationError

        if authError?.code == .canceled {
            call.reject("USER_CANCELLED", "1001", error)
        } else {
            call.reject(error.localizedDescription, nil, error)
        }
    }
}

extension AppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return self.bridge?.webView?.window ?? UIWindow()
    }
}
