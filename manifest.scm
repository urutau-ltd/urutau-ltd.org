;; manifest.scm --- Guix Shell manifest file -*- mode: scheme; -*-
;;
;; SPDX-License-Identifier: GPL-3.0-or-later
;; Copyright © 2025 Urutau-Ltd <softwarelibre@urutau-ltd.org>
;;
;;   , _ ,      _    _            _                     _ _      _
;;  ( o o )    | |  | |          | |                   | | |    | |
;; /'` ' `'\   | |  | |_ __ _   _| |_ __ _ _   _ ______| | |_ __| |
;; |'''''''|   | |  | | '__| | | | __/ _` | | | |______| | __/ _` |
;; |\\'''//|   | |__| | |  | |_| | || (_| | |_| |      | | || (_| |
;;    """       \____/|_|   \__,_|\__\__,_|\__,_|      |_|\__\__,_|
;;
;; This program is free software: you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or (at
;; your option) any later version.
;;
;; This program is distributed in the hope that it will be useful, but
;; WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
;; General Public License for more details.
;;
;; You should have received a copy of the GNU General Public License
;; along with this program. If not, see <https://www.gnu.org/licenses/>.
(use-modules (gnu packages perl)
             (guix packages)
             (guix git-download)
             (guix build-system copy)
             (guix utils)
             ((guix licenses)
              #:prefix license:)
             (guix gexp))

(define %source
  (dirname (current-filename)))

(define nyc
  (package
    (name "nyc")
    (version "2.0.0")
    (source
     (local-file %source
                 #:recursive? #t
                 #:select? (git-predicate %source)))
    (build-system copy-build-system)
    (arguments
     (list
      #:install-plan
      #~'(("bin/nyc" "bin/nyc"))
      #:phases
      #~(modify-phases %standard-phases
          (add-after 'install 'wrap-nyc
            (lambda _
              (wrap-program (string-append #$output "/bin/nyc")
                )
              `("PERL5LIB" ":" prefix
                (,(getenv "PERL5LIB") ,(string-append #$output
                                                      "/lib/perl5/site_perl"))))))))
    (inputs (list perl))
    (home-page "https://urutau-ltd.org")
    (synopsis "Lume blog managing script")
    (description
     "nyc is a CLI made in perl used to manage this particular
project blog. It's inspired by hugo cli and should not be used outside
this repository!")
    (license license:gpl3+)))

(define genmail
  (package
    (name "genmail")
    (version "1.0.0")
    (source
     (local-file %source
                 #:recursive? #t
                 #:select? (git-predicate %source)))
    (build-system copy-build-system)
    (arguments
     (list
      #:substitutable? #f
      #:install-plan
      #~'(("genmail.pl" "bin/genmail"))
      #:phases
      #~(modify-phases %standard-phases
          (add-after 'install 'wrap-script
            (lambda _
              (wrap-program (string-append #$output "/bin/genmail")
                )
              `("PERL5LIB" ":" prefix
                (,(getenv "PERL5LIB") ,(string-append #$output
                                                      "/lib/perl5/site_perl"))))))))
    (inputs (list perl))
    (home-page "https://urutau-ltd.org")
    (synopsis "Email obfuscation script for urutau-ltd.org website")
    (description
     "This tool is used to describe your contact.md email hash to prevent
primitive crawlers/spambots to ruin your precious inbox with their nasty
emails.")
    (license license:gpl3+)))

(concatenate-manifests (list (specifications->manifest (list "gcc-toolchain"
                                                        "bash"
                                                        "coreutils"
                                                        "ncurses"
                                                        "emacs"
                                                        "emacs-evil"
                                                        "emacs-geiser-guile"
                                                        "emacs-paredit"
                                                        "emacs-arei"
                                                        "make"
                                                        "perl"
                                                        "perl-critic"
                                                        "perltidy"
                                                        "git"
                                                        "podman"
                                                        "podman-compose"))
                             (packages->manifest (list nyc
                                                       genmail))))
