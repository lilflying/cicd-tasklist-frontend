pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_NAME = 'maberger38/tasklist-frontend'
        SONAR_HOST_URL = 'https://sonarqube.cicd.kits.ext.educentre.fr'
        SONAR_PROJECT_KEY = 'martin-tasklist-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Récupération du code source...'
                checkout scm
            }
        }

        stage('Installation des dépendances') {
            steps {
                echo '📦 Installation des dépendances npm...'
                sh 'npm ci'
            }
        }

        stage('Tests unitaires') {
            steps {
                echo '🧪 Exécution des tests unitaires...'
                sh 'npm run test:coverage'
            }
            post {
                always {
                    echo '📊 Publication des rapports de tests...'
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                    archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build') {
            steps {
                echo '🔨 Build du projet...'
                sh 'npm run build'
            }
        }

        stage('Analyse SonarQube') {
            steps {
                echo '🔍 Analyse SonarQube...'
                withCredentials([string(credentialsId: 'maberger38-sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        npm install -g sonarqube-scanner
                        sonar-scanner \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.token=${SONAR_TOKEN} \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName="TaskList Frontend - Build ${BUILD_NUMBER}" \
                            -Dsonar.sources=src \
                            -Dsonar.exclusions="src/__tests__/**" \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.testExecutionReportPaths=""
                    '''
                }
            }
        }

        stage('Vérification Quality Gate SonarQube') {
            steps {
                echo '✅ Vérification de la Quality Gate...'
                withCredentials([string(credentialsId: 'maberger38-sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        # Attendre que SonarQube traite le rapport
                        sleep 5

                        # Vérifier la quality gate via l'API SonarQube
                        QUALITY_GATE_STATUS=$(curl -s \
                            -u "${SONAR_TOKEN}:" \
                            "${SONAR_HOST_URL}/api/qualitygates/project_status?projectKey=${SONAR_PROJECT_KEY}" \
                            | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)

                        echo "Quality Gate Status: ${QUALITY_GATE_STATUS}"

                        if [ "${QUALITY_GATE_STATUS}" != "OK" ]; then
                            echo "❌ Quality Gate FAILED"
                            exit 1
                        fi

                        echo "✅ Quality Gate PASSED"
                    '''
                }
            }
        }

        stage('Construction de l\'image Docker') {
            steps {
                echo '🐳 Construction de l\'image Docker...'
                sh '''
                    docker buildx build \
                        --tag ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} \
                        --tag ${DOCKER_IMAGE_NAME}:latest \
                        --load \
                        .
                '''
            }
        }

        stage('Scan de sécurité Trivy') {
            steps {
                echo '🔐 Scan de sécurité avec Trivy...'
                sh '''
                    # Scan avec rapport de sortie
                    trivy image \
                        --severity CRITICAL,HIGH \
                        --format json \
                        --output trivy-report.json \
                        ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}

                    # Affichage du rapport
                    trivy image \
                        --severity CRITICAL,HIGH \
                        --format table \
                        ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}

                    # Vérifier s'il y a des vulnérabilités CRITICAL ou HIGH
                    VULN_COUNT=$(grep -o '"Severity":"\\(HIGH\\|CRITICAL\\)' trivy-report.json 2>/dev/null | wc -l || echo 0)

                    if [ ${VULN_COUNT} -gt 0 ]; then
                        echo "❌ ${VULN_COUNT} vulnérabilités CRITICAL/HIGH détectées"
                        exit 1
                    fi

                    echo "✅ Aucune vulnérabilité CRITICAL/HIGH détectée"
                '''
            }
            post {
                always {
                    echo '📁 Archivage des rapports Trivy...'
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }

        stage('Génération des SBOM') {
            steps {
                echo '📋 Génération des SBOM...'
                sh '''
                    # SBOM SPDX
                    trivy image \
                        --format spdx-json \
                        --output sbom-spdx.json \
                        ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}

                    # SBOM CycloneDX
                    trivy image \
                        --format cyclonedx \
                        --output sbom-cyclonedx.json \
                        ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}

                    echo "✅ SBOM générés"
                '''
            }
            post {
                always {
                    echo '📁 Archivage des SBOM...'
                    archiveArtifacts artifacts: 'sbom-*.json', allowEmptyArchive: true
                }
            }
        }

        stage('Publication sur Docker Hub') {
            steps {
                echo '🚀 Publication de l\'image Docker...'
                withCredentials([usernamePassword(credentialsId: 'maberger38-dockerhub-password', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin

                        docker push ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE_NAME}:latest

                        docker logout

                        echo "✅ Image pushée sur Docker Hub"
                    '''
                }
            }
        }

        stage('Nettoyage') {
            steps {
                echo '🧹 Nettoyage du workspace...'
                cleanWs()
            }
        }
    }

    post {
        always {
            echo '📊 Génération du résumé...'
            sh '''
                echo "==================================="
                echo "Pipeline Build #${BUILD_NUMBER} terminée"
                echo "==================================="
                echo "Docker Image: ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}"
                echo "==================================="
            '''
        }
        success {
            echo '✅ Pipeline réussie !'
        }
        failure {
            echo '❌ Pipeline échouée !'
        }
    }
}
