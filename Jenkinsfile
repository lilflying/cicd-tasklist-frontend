pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = credentials('maberger38-dockerhub-password')
        DOCKER_PASSWORD = credentials('maberger38-dockerhub-password')
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/tasklist-frontend"
        SONAR_HOST_URL = 'https://sonarqube.cicd.kits.ext.educentre.fr'
        SONAR_TOKEN = credentials('maberger38-sonar-token')
        BUILD_TAG = "${BUILD_NUMBER}"
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
                    junit 'reports/junit.xml'
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
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
                sh '''
                    sonar-scanner \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.token=${SONAR_TOKEN} \
                        -Dsonar.projectKey=martin-tasklist-frontend \
                        -Dsonar.projectName="TaskList Frontend - Build ${BUILD_TAG}" \
                        -Dsonar.sources=src \
                        -Dsonar.exclusions="src/__tests__/**" \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.testExecutionReportPaths=""
                '''
            }
        }

        stage('Vérification Quality Gate SonarQube') {
            steps {
                echo '✅ Vérification de la Quality Gate...'
                sh '''
                    # Attendre que SonarQube traite le rapport (optionnel)
                    sleep 5

                    # Vérifier la quality gate via l'API SonarQube
                    QUALITY_GATE_STATUS=$(curl -s \
                        -u "${SONAR_TOKEN}:" \
                        "${SONAR_HOST_URL}/api/qualitygates/project_status?projectKey=martin-tasklist-frontend" \
                        | grep -o '"status":"[^"]*' | cut -d'"' -f4)

                    echo "Quality Gate Status: ${QUALITY_GATE_STATUS}"

                    if [ "${QUALITY_GATE_STATUS}" != "OK" ]; then
                        echo "❌ Quality Gate FAILED"
                        exit 1
                    fi

                    echo "✅ Quality Gate PASSED"
                '''
            }
        }

        stage('Construction de l\'image Docker') {
            steps {
                echo '🐳 Construction de l\'image Docker...'
                sh '''
                    docker buildx build \
                        --tag ${DOCKER_IMAGE}:${BUILD_TAG} \
                        --tag ${DOCKER_IMAGE}:latest \
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
                        ${DOCKER_IMAGE}:${BUILD_TAG}

                    # Affichage du rapport
                    trivy image \
                        --severity CRITICAL,HIGH \
                        --format table \
                        ${DOCKER_IMAGE}:${BUILD_TAG}

                    # Vérifier s'il y a des vulnérabilités CRITICAL ou HIGH
                    VULN_COUNT=$(cat trivy-report.json | grep -o '"Severity":"HIGH\\|CRITICAL' | wc -l)

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
                        ${DOCKER_IMAGE}:${BUILD_TAG}

                    # SBOM CycloneDX
                    trivy image \
                        --format cyclonedx \
                        --output sbom-cyclonedx.json \
                        ${DOCKER_IMAGE}:${BUILD_TAG}

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
                sh '''
                    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin

                    docker push ${DOCKER_IMAGE}:${BUILD_TAG}
                    docker push ${DOCKER_IMAGE}:latest

                    docker logout

                    echo "✅ Image pushée sur Docker Hub"
                '''
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
                echo "Docker Image: ${DOCKER_IMAGE}:${BUILD_TAG}"
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
